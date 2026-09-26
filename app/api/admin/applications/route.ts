import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireAdmin, isValidObjectId } from "@/lib/admin-guard";
import { ensureIndexesAndAdmin, getApplicationsCollection, logAdminAction } from "@/lib/db";
import { publishEvent } from "@/lib/realtime";
import { notify } from "@/lib/notifications";
import { sendDecisionEmail } from "@/lib/email";
import { z } from "zod";

const PatchSchema = z.object({
  id: z.string().optional(),
  ids: z.array(z.string().min(1)).max(200).optional(),
  action: z.enum(["APPROVE", "REJECT"]),
  message: z.string().max(600).optional().default(""),
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

  const applications = await getApplicationsCollection();
  const doc = applications.find({});
  if (status === "PENDING" || status === "APPROVED" || status === "REJECTED") {
    doc.filter({ status });
  }
  if (from) {
    const fromDate = new Date(from);
    if (!Number.isNaN(fromDate.getTime())) {
      doc.filter({ createdAt: { $gte: fromDate } });
    }
  }
  if (to) {
    const toDate = new Date(to);
    if (!Number.isNaN(toDate.getTime())) {
      doc.filter({ createdAt: { $lte: toDate } });
    }
  }
  const [docs, appsTotal, appsPending, appsApproved, appsRejected] = await Promise.all([
    doc.sort({ createdAt: -1 }).limit(200).toArray(),
    applications.countDocuments({}),
    applications.countDocuments({ status: "PENDING" }),
    applications.countDocuments({ status: "APPROVED" }),
    applications.countDocuments({ status: "REJECTED" }),
  ]);

  const list = docs.map((d) => ({
    id: String(d._id),
    userId: d.userId,
    name: d.name,
    email: d.email,
    place: d.place,
    bio: d.bio,
    course: d.course,
    message: d.message,
    status: d.status,
    adminMessage: d.adminMessage,
    createdAt: d.createdAt.toISOString(),
  }));

  return NextResponse.json({
    applications: list,
    counts: { appsTotal, appsPending, appsApproved, appsRejected },
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

  const { id, ids, action, message } = parsed.data;

  // Normalize to a list of target ids (single `id` or bulk `ids`).
  const targets = id ? [id] : ids ?? [];
  if (targets.length === 0) {
    return NextResponse.json({ message: "No records specified." }, { status: 400 });
  }
  const validIds = targets.filter((t) => isValidObjectId(t));
  if (validIds.length === 0 && targets.length > 0) {
    return NextResponse.json({ message: "Invalid record id." }, { status: 400 });
  }

  await ensureIndexesAndAdmin();
  const applications = await getApplicationsCollection();

  const status = action === "APPROVE" ? "APPROVED" : "REJECTED";

  if (validIds.length === 1) {
    // Single-record path keeps per-user email/notification behavior intact.
    const objectId = new ObjectId(validIds[0]);
    const target = await applications.findOne(
      { _id: objectId },
      { projection: { userId: 1, email: 1, name: 1 } }
    );

    const result = await applications.updateOne(
      { _id: objectId },
      {
        $set: {
          status,
          adminMessage: message || null,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Record not found." }, { status: 404 });
    }

    publishEvent({
      table: "applications",
      userId: target?.userId as string | undefined,
      at: Date.now(),
    });

    void logAdminAction({
      actor: admin.email ?? "admin",
      action,
      targetType: "application",
      targetLabel: target?.email,
      detail: message || undefined,
    });

    if (target?.userId) {
      await notify(String(target.userId), {
        kind: "application",
        title: status === "APPROVED" ? "Application approved" : "Application not selected",
        message:
          message ||
          (status === "APPROVED"
            ? "Your application was approved — you can now enroll."
            : "Your application was not selected this time."),
        href: "/dashboard",
      });
    }

    if (target?.email) {
      void sendDecisionEmail({
        to: target.email,
        name: target.name,
        kind: "application",
        approved: status === "APPROVED",
        subject:
          status === "APPROVED"
            ? "Your application was approved 🎉"
            : "Update on your application",
        message,
        href: "/dashboard",
      }).catch(() => {});
    }

    // On approval: record the course fee as a pending deposit (auto, once per
    // student+course) so the ledger reflects the chosen programme.
    if (status === "APPROVED" && target) {
      await ensureIndexesAndAdmin();
      const { getCoursesCollection } = await import("@/lib/db");
      const { sendWaText } = await import("@/lib/whatsapp");
      try {
        const dbCol = await getApplicationsCollection();
        const full = await dbCol.findOne({ _id: objectId });
        const courseName = (full as { course?: string } | null)?.course ?? "";
        const courseFee = await getCoursesCollection().then((c) =>
          c.findOne({ name: courseName, active: true })
        );
        const amount = Number(courseFee?.fee ?? 0);
        if (amount > 0) {
          const { getDb } = await import("@/lib/db");
          const db = await getDb();
          const dup = await db.collection("payments").findOne({
            userId: String(target.userId),
            note: { $regex: "auto:" + courseName.replace(/[^a-z0-9]+/gi, "-") + ":" },
            status: { $in: ["PENDING", "PAID"] },
          });
          if (!dup) {
            await db.collection("payments").insertOne({
              enrollmentId: "",
              userId: String(target.userId),
              amount,
              currency: "PKR",
              provider: "manual",
              status: "PENDING",
              type: "DEPOSIT",
              method: "bank",
              note: `auto:${courseName.replace(/[^a-z0-9]+/gi, "-") || "course"}:${String(objectId)}`,
              studentName: full?.name,
              studentEmail: full?.email,
              createdBy: `${admin.email ?? "admin"} / AI Agent`,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      } catch {
        // ledger record is best-effort — never fail approval on a hiccup
      }
      try {
        const db2 = await (await import("@/lib/db")).getDb();
        const user = await db2
          .collection("users")
          .findOne({ _id: new ObjectId(target.userId) }, { projection: { phone: 1, whatsapp: 1 } });
        const phone =
          (user as { phone?: string; whatsapp?: string } | null)?.phone ||
          (user as { phone?: string; whatsapp?: string } | null)?.whatsapp;
        const full2 = await applications.findOne({ _id: objectId });
        if (phone && full2) {
          void sendWaText({
            to: phone,
            text: `🎉 Congratulations ${full2.name}! Your application for ${full2.course} has been approved. Our team will contact you to confirm your enrollment. Welcome to Language Hub!`,
          }).catch(() => {});
        }
      } catch {
        // whatsapp best-effort
      }
    }

    return NextResponse.json({ ok: true, status, updated: 1 });
  }

  // Bulk path — update status for all matching valid ids.
  const objectIds = validIds.map((t) => new ObjectId(t));

  // Notify each affected user (best-effort, in parallel).
  const affectedTargets = await applications
    .find({ _id: { $in: objectIds } })
    .project({ userId: 1, email: 1, name: 1 })
    .toArray();

  await applications.updateMany(
    { _id: { $in: objectIds } },
    {
      $set: {
        status,
        adminMessage: message || null,
        updatedAt: new Date(),
      },
    }
  );

  await Promise.all(
    affectedTargets.map((target) => {
      if (target?.userId) {
        return notify(String(target.userId), {
          kind: "application",
          title: status === "APPROVED" ? "Application approved" : "Application not selected",
          message: message || (status === "APPROVED" ? "Your application was approved." : "Your application was not selected."),
          href: "/dashboard",
        });
      }
      return undefined;
    })
  );

  // Fire-and-forget notifications + emails.
  affectedTargets.forEach((target) => {
    publishEvent({
      table: "applications",
      userId: target?.userId as string | undefined,
      at: Date.now(),
    });
    if (target?.email) {
      void sendDecisionEmail({
        to: target.email,
        name: target.name,
        kind: "application",
        approved: status === "APPROVED",
        subject: status === "APPROVED" ? "Your application was approved" : "Update on your application",
        message,
        href: "/dashboard",
      }).catch(() => {});
    }
  });

  void logAdminAction({
    actor: admin.email ?? "admin",
    action: `BULK_${action}`,
    targetType: "application",
    targetLabel: `${objectIds.length} records`,
    detail: message || undefined,
  });

  return NextResponse.json({ ok: true, status, updated: objectIds.length });
}