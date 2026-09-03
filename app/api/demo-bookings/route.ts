import { NextResponse } from "next/server";

import { getDemoBookingsCollection, ensureIndexesAndAdmin } from "@/lib/db";
import { publishEvent } from "@/lib/realtime";
import { DemoBookingSchema, fieldErrors } from "@/lib/validate";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { notifyAdmins, listAdminEmails } from "@/lib/notifications";
import { sendNewDemoBookingEmail, sendDemoBookingConfirmationEmail } from "@/lib/email";

/**
 * Public endpoint to book a free demo class. Does NOT require an account, so
 * prospective students can reach out easily. Real-time + email + notification
 * alerts flow to the admins for follow-up. On success, sends an instant
 * WhatsApp deep link + confirmation email to the student.
 */
export async function POST(request: Request) {
  const rl = await rateLimitDb(await clientKey(request, "demo-booking"), 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many booking requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = DemoBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: fieldErrors(parsed) },
      { status: 400 }
    );
  }

  await ensureIndexesAndAdmin();

  const data = parsed.data;
  const bookings = await getDemoBookingsCollection();

  const now = new Date();
  const result = await bookings.insertOne({
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    preferredDate: data.preferredDate.trim(),
    preferredTime: data.preferredTime.trim(),
    course: data.course,
    message: data.message || null,
    status: "CONFIRMED",
    adminMessage: null,
    createdAt: now,
    updatedAt: now,
  });

  publishEvent({ table: "demo_bookings", at: Date.now() });

  await notifyAdmins({
    kind: "demo-booking",
    title: "New demo booking",
    message: `${data.name.trim()} booked a ${data.course} demo for ${data.preferredDate} at ${data.preferredTime}.`,
    href: "/admin-panel",
  });

  // Instant confirmation email to the student
  void sendDemoBookingConfirmationEmail({
    to: data.email.trim(),
    name: data.name.trim(),
    course: data.course,
    preferredDate: data.preferredDate,
    preferredTime: data.preferredTime,
  });

  // Admin alert email
  void listAdminEmails().then((emails) => {
    void Promise.all(
      emails.map((to) =>
        sendNewDemoBookingEmail({
          to,
          name: data.name.trim(),
          course: data.course,
          preferredDate: data.preferredDate,
          preferredTime: data.preferredTime,
        })
      )
    );
  });

  // Build WhatsApp deep link for the student to confirm / ask questions
  const digits = data.phone.replace(/[^\d]/g, "");
  const waStudentLink = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(
        `Hi Language Hub! I just booked a ${data.course} demo on ${data.preferredDate} at ${data.preferredTime}. Looking forward to it!`
      )}`
    : "";

  return NextResponse.json(
    {
      id: String(result.insertedId),
      ok: true,
      status: "CONFIRMED",
      whatsappLink: waStudentLink,
      confirmation: {
        course: data.course,
        date: data.preferredDate,
        time: data.preferredTime,
      },
    },
    { status: 201 }
  );
}
