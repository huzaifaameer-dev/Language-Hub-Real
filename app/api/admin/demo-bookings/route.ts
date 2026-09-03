import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireAdmin, isValidObjectId } from "@/lib/admin-guard";
import { ensureIndexesAndAdmin, getDemoBookingsCollection } from "@/lib/db";
import { publishEvent } from "@/lib/realtime";
import { sendDemoBookingDecisionEmail } from "@/lib/email";
import { z } from "zod";

const PatchSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["CONFIRM", "REJECT"]),
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

  const bookings = await getDemoBookingsCollection();
  const doc = bookings.find({});
  if (status === "PENDING" || status === "CONFIRMED" || status === "REJECTED") {
    doc.filter({ status });
  }
  const [docs, total, pending, confirmed, rejected] = await Promise.all([
    doc.sort({ createdAt: -1 }).limit(200).toArray(),
    bookings.countDocuments({}),
    bookings.countDocuments({ status: "PENDING" }),
    bookings.countDocuments({ status: "CONFIRMED" }),
    bookings.countDocuments({ status: "REJECTED" }),
  ]);

  const list = docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    email: d.email,
    phone: d.phone,
    preferredDate: d.preferredDate,
    preferredTime: d.preferredTime,
    course: d.course,
    message: d.message,
    status: d.status,
    adminMessage: d.adminMessage,
    createdAt: d.createdAt.toISOString(),
  }));

  return NextResponse.json({
    bookings: list,
    counts: { total, pending, confirmed, rejected },
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

  const { id, action, message } = parsed.data;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ message: "Invalid record id." }, { status: 400 });
  }

  await ensureIndexesAndAdmin();
  const bookings = await getDemoBookingsCollection();

  const target = await bookings.findOne(
    { _id: new ObjectId(id) },
    { projection: { email: 1, name: 1, course: 1, preferredDate: 1, preferredTime: 1 } }
  );

  const status = action === "CONFIRM" ? "CONFIRMED" : "REJECTED";
  const result = await bookings.updateOne(
    { _id: new ObjectId(id) },
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

  publishEvent({ table: "demo_bookings", at: Date.now() });

  if (target?.email) {
    void sendDemoBookingDecisionEmail({
      to: target.email,
      name: target.name,
      confirmed: status === "CONFIRMED",
      course: target.course,
      preferredDate: target.preferredDate,
      preferredTime: target.preferredTime,
      message,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, status });
}
