import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { revalidateTag } from "next/cache";
import { requireAdmin, isValidObjectId } from "@/lib/admin-guard";
import { ensureIndexesAndAdmin, getEnrollmentsCollection, logAdminAction, type EnrollmentStatus } from "@/lib/db";
import { checkSeatAvailability } from "@/lib/course-stats";
import { publishEvent } from "@/lib/realtime";
import { notify } from "@/lib/notifications";
import { sendDecisionEmail } from "@/lib/email";
import { z } from "zod";

const PatchSchema = z.object({
  id: z.string().optional(),
  ids: z.array(z.string().min(1)).max(200).optional(),
  action: z.enum(["REQUEST_PAYMENT", "CONFIRM", "REJECT"]),
  message: z.string().max(600).optional().default(""),
  paymentInstructions: z.string().max(600).optional().default(""),
});

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  await ensureIndexesAndAdmin();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.toUpperCase();
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const ALLOWED: EnrollmentStatus[] = ["PENDING", "AWAITING_PAYMENT", "PROOF_SUBMITTED", "ENROLLED", "REJECTED"];
  const filter: Record<string, unknown> = ALLOWED.includes(status as EnrollmentStatus)
    ? { status: status as EnrollmentStatus }
    : {};
  if (from) {
    const fromDate = new Date(from);
    if (!Number.isNaN(fromDate.getTime())) {
      filter.createdAt = { $gte: fromDate };
    }
  }
  if (to) {
    const toDate = new Date(to);
    if (!Number.isNaN(toDate.getTime())) {
      filter.createdAt = { ...(filter.createdAt ?? {}), $lte: toDate };
    }
  }
  const enrollments = await getEnrollmentsCollection();
  const [docs, enrsPending, enrsAwaiting, enrsProof, enrsEnrolled, enrsRejected] = await Promise.all([
    enrollments.find(filter).sort({ createdAt: -1 }).limit(200).toArray(),
    enrollments.countDocuments({ status: "PENDING" }),
    enrollments.countDocuments({ status: "AWAITING_PAYMENT" }),
    enrollments.countDocuments({ status: "PROOF_SUBMITTED" }),
    enrollments.countDocuments({ status: "ENROLLED" }),
    enrollments.countDocuments({ status: "REJECTED" }),
  ]);

  const list = docs.map((d) => ({
    id: String(d._id),
    userId: d.userId,
    applicationId: d.applicationId,
    name: d.name,
    email: d.email,
    subjects: d.subjects,
    batch: d.batch,
    plan: d.plan,
    paymentMethod: d.paymentMethod,
    paymentInstructions: d.paymentInstructions,
    paymentProof: d.paymentProof,
    status: d.status,
    adminMessage: d.adminMessage,
    createdAt: d.createdAt.toISOString(),
  }));

  return NextResponse.json({
    enrollments: list,
    counts: { enrsPending, enrsAwaiting, enrsProof, enrsEnrolled, enrsRejected },
  });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  const { id, ids, action, message, paymentInstructions } = parsed.data;
  const targets = id ? [id] : ids ?? [];
  if (targets.length === 0) {
    return NextResponse.json({ message: "No records specified." }, { status: 400 });
  }
  const validIds = targets.filter((t) => isValidObjectId(t));
  if (validIds.length === 0 && targets.length > 0) {
    return NextResponse.json({ message: "Invalid record id." }, { status: 400 });
  }

  await ensureIndexesAndAdmin();
  const enrollments = await getEnrollmentsCollection();

  const statusMap: Record<string, EnrollmentStatus> = {
    REQUEST_PAYMENT: "AWAITING_PAYMENT",
    CONFIRM: "ENROLLED",
    REJECT: "REJECTED",
  };
  const status = statusMap[action];

  // Bulk CONFIRM requires checking seat availability for each record.
  if (action === "CONFIRM" && validIds.length > 1) {
    const objectIds = validIds.map((v) => new ObjectId(v));
    const pendingDocs = await enrollments
      .find({ _id: { $in: objectIds } })
      .project({ userId: 1, email: 1, name: 1, subjects: 1, batch: 1 })
      .toArray();

    for (const t of pendingDocs) {
      if (t.subjects?.length && t.batch) {
        const gate = await checkSeatAvailability(t.subjects, t.batch);
        if (!gate.ok) {
          return NextResponse.json(
            { message: `${t.name}: ${gate.message}`, code: gate.code },
            { status: gate.code === "BATCH_FULL" ? 409 : 400 }
          );
        }
      }
    }

    const $set: Record<string, unknown> = {
      status,
      adminMessage: message || null,
      updatedAt: new Date(),
    };
    await enrollments.updateMany({ _id: { $in: objectIds } }, { $set });

    await Promise.all(
      pendingDocs.map((t) => {
        if (!t.userId) return undefined;
        return notify(String(t.userId), {
          kind: "enrollment",
          title: "Enrollment confirmed",
          message: "Your seat is locked in. Your bookshelf is ready.",
          href: "/dashboard",
        });
      })
    );
    pendingDocs.forEach((t) => {
      publishEvent({ table: "enrollments", userId: String(t.userId), at: Date.now() });
      if (t.email) {
        void sendDecisionEmail({
          to: t.email,
          name: t.name,
          kind: "enrollment",
          approved: true,
          subject: "Your enrollment is confirmed",
          message,
          href: "/dashboard",
        }).catch(() => {});
      }
    });

    revalidateTag("catalog", { expire: 0 });
    void logAdminAction({
      actor: admin.email ?? "admin",
      action: `BULK_${action}`,
      targetType: "enrollment",
      targetLabel: `${pendingDocs.length} records`,
    });

    return NextResponse.json({ ok: true, status, updated: pendingDocs.length });
  }

  // Single-record path (or bulk non-confirm: iterate per record).
  const objectIds = validIds.map((v) => new ObjectId(v));

  if (validIds.length === 1) {
    const objectId = objectIds[0];
    const target = await enrollments.findOne(
      { _id: objectId },
      { projection: { userId: 1, email: 1, name: 1, subjects: 1, batch: 1 } }
    );

    // Confirming a seat is the same purchase as a fresh enrollment: the target
    // batch must still have room, otherwise the catalog seat counts would drift
    // above capacity the moment the pending request turns ENROLLED.
    if (action === "CONFIRM" && target?.subjects?.length && target?.batch) {
      const gate = await checkSeatAvailability(target.subjects, target.batch);
      if (!gate.ok) {
        return NextResponse.json(
          { message: gate.message, code: gate.code },
          { status: gate.code === "BATCH_FULL" ? 409 : 400 }
        );
      }
    }

    const $set: Record<string, unknown> = {
      status,
      adminMessage: message || null,
      updatedAt: new Date(),
    };
    if (action === "REQUEST_PAYMENT" && paymentInstructions) {
      $set.paymentInstructions = paymentInstructions;
    }

    const result = await enrollments.updateOne({ _id: objectId }, { $set });

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Record not found." }, { status: 404 });
    }

    publishEvent({
      table: "enrollments",
      userId: target?.userId as string | undefined,
      at: Date.now(),
    });

    void logAdminAction({
      actor: admin.email ?? "admin",
      action,
      targetType: "enrollment",
      targetLabel: target?.email,
      detail: message || undefined,
    });

    // A confirmed seat changes catalog availability instantly.
    if (action === "CONFIRM") revalidateTag("catalog", { expire: 0 });

    if (target?.userId) {
      const notifyMap: Record<string, { title: string; body: string }> = {
        REQUEST_PAYMENT: {
          title: "Complete your payment to enroll",
          body:
            paymentInstructions ||
            "We asked you to complete your payment. Check your dashboard for details.",
        },
        CONFIRM: {
          title: "Enrollment confirmed",
          body: "Your seat is locked in. Your bookshelf is ready.",
        },
        REJECT: {
          title: "Enrollment request declined",
          body: message || "Your enrollment request was declined.",
        },
      };
      await notify(String(target.userId), {
        kind: "enrollment",
        title: notifyMap[action].title,
        message: notifyMap[action].body,
        href: "/dashboard",
      });
    }

    if (target?.email) {
      void sendDecisionEmail({
        to: target.email,
        name: target.name,
        kind: "enrollment",
        approved: action === "CONFIRM",
        subject:
          action === "CONFIRM"
            ? "Your enrollment is confirmed"
            : action === "REQUEST_PAYMENT"
              ? "Action needed: complete your payment"
              : "Your enrollment request was declined",
        message,
        href: "/dashboard",
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, status });
  }

  // Bulk non-confirm (REQUEST_PAYMENT / REJECT): no seat-gate check needed.
  await enrollments.updateMany(
    { _id: { $in: objectIds } },
    {
      $set: {
        status,
        adminMessage: message || null,
        ...(action === "REQUEST_PAYMENT" && paymentInstructions
          ? { paymentInstructions }
          : {}),
        updatedAt: new Date(),
      },
    }
  );

  const affected = await enrollments
    .find({ _id: { $in: objectIds } })
    .project({ userId: 1, email: 1, name: 1 })
    .toArray();

  await Promise.all(
    affected.map((t) => {
      if (!t.userId) return undefined;
      const notifyMap: Record<string, { title: string; body: string }> = {
        REQUEST_PAYMENT: {
          title: "Complete your payment to enroll",
          body: paymentInstructions || "We asked you to complete your payment.",
        },
        REJECT: {
          title: "Enrollment request declined",
          body: message || "Your enrollment request was declined.",
        },
      };
      return notify(String(t.userId), {
        kind: "enrollment",
        title: notifyMap[action].title,
        message: notifyMap[action].body,
        href: "/dashboard",
      });
    })
  );

  affected.forEach((t) => {
    publishEvent({ table: "enrollments", userId: String(t.userId), at: Date.now() });
    if (t.email) {
      void sendDecisionEmail({
        to: t.email,
        name: t.name,
        kind: "enrollment",
        approved: action === "CONFIRM",
        subject:
          action === "REQUEST_PAYMENT"
            ? "Action needed: complete your payment"
            : "Your enrollment request was declined",
        message,
        href: "/dashboard",
      }).catch(() => {});
    }
  });

  void logAdminAction({
    actor: admin.email ?? "admin",
    action: `BULK_${action}`,
    targetType: "enrollment",
    targetLabel: `${affected.length} records`,
  });

  return NextResponse.json({ ok: true, status, updated: affected.length });
}