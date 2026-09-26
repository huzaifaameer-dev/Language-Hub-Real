import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { requireAdmin, isValidObjectId } from "@/lib/admin-guard";
import {
  ensureIndexesAndAdmin,
  getRegistrationsCollection,
  logAdminAction,
} from "@/lib/db";
import { notify } from "@/lib/notifications";
import { REGISTRATION_STATUSES, type RegistrationStatus } from "@/lib/registration-config";

const PatchSchema = z.object({
  id: z.string().min(1).optional(),
  status: z.enum(["CONTACTED", "ENROLLED"]),
  message: z.string().max(600).trim().optional().default(""),
});

/** Admin listing of course registrations with queue counts. */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  await ensureIndexesAndAdmin();
  const { searchParams } = new URL(request.url);
  const qstatus = searchParams.get("status")?.toUpperCase();
  const registrations = await getRegistrationsCollection();

  const filter: { status?: RegistrationStatus } =
    qstatus && (REGISTRATION_STATUSES as readonly string[]).includes(qstatus)
      ? { status: qstatus as RegistrationStatus }
      : {};

  // List rows carry no binary payloads — photo / receipt / PDF base64 are
  // streamed on demand through /api/registrations/media/:id. Otherwise the
  // queue response would be megabytes of base64 per registration on serverless.
  const doc = registrations.find(
    filter,
    { projection: { photo: 0, pdfPath: 0, "payment.receipt": 0 } }
  );

  const [docs, regTotal, regNew, regContacted, regEnrolled] = await Promise.all([
    doc.sort({ createdAt: -1 }).limit(200).toArray(),
    registrations.countDocuments({}),
    registrations.countDocuments({ status: "NEW" }),
    registrations.countDocuments({ status: "CONTACTED" }),
    registrations.countDocuments({ status: "ENROLLED" }),
  ]);

  const list = docs.map((d) => ({
    id: String(d._id),
    ref: d.ref,
    userId: d.userId,
    name: d.name,
    email: d.email,
    course: d.course,
    courseKey: d.courseKey,
    phone: d.phone,
    address: d.address,
    dob: d.dob,
    education: d.education,
    study: d.study,
    payment: d.payment,
    status: d.status,
    adminMessage: d.adminMessage ?? null,
    pdfAttached: d.pdfAttached,
    createdAt: d.createdAt.toISOString(),
  }));

  return NextResponse.json({
    registrations: list,
    counts: { regTotal, regNew, regContacted, regEnrolled },
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

  const { id, status, message } = parsed.data;
  if (!id || !isValidObjectId(id)) {
    return NextResponse.json({ message: "Invalid record id." }, { status: 400 });
  }

  await ensureIndexesAndAdmin();
  const registrations = await getRegistrationsCollection();
  const objectId = new ObjectId(id);

  const target = await registrations.findOne({ _id: objectId }, { projection: { userId: 1, name: 1, course: 1, email: 1 } });
  const result = await registrations.updateOne(
    { _id: objectId },
    { $set: { status, adminMessage: message || null, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ message: "Record not found." }, { status: 404 });
  }

  void logAdminAction({
    actor: admin.email ?? "admin",
    action: status,
    targetType: "registration",
    targetLabel: target?.email,
    detail: message || undefined,
  });

  if (target?.userId) {
    await notify(String(target.userId), {
      kind: "registration",
      title: status === "ENROLLED" ? "Enrollment confirmed" : "We contacted you",
      message:
        message ||
        (status === "ENROLLED"
          ? `Welcome to ${target.course ?? "your course"} — your seat is confirmed.`
          : "Thanks for registering — we'll reach out very soon."),
      href: "/dashboard",
    });
  }

  return NextResponse.json({ ok: true, status });
}