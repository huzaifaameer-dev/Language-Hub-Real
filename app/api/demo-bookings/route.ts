import { NextResponse, after } from "next/server";

import { createDemoBooking } from "@/lib/server/learner";
import { publishEvent } from "@/lib/realtime";
import { DemoBookingSchema, fieldErrors } from "@/lib/validate";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { notifyAdmins, listAdminEmails } from "@/lib/notifications";
import { sendNewDemoBookingEmail, sendDemoBookingConfirmationEmail } from "@/lib/email";
import { botGuardError } from "@/lib/bot-check";

/**
 * Public endpoint to book a free demo class. No account required, so a
 * prospective student can reach out in seconds. Bookings land in PostgreSQL,
 * alert the admins (in-app + email) and return an instant WhatsApp deep link.
 */
export async function POST(request: Request) {
  const rl = await rateLimitDb(
    await clientKey(request, "demo-booking"),
    5,
    60 * 60 * 1000
  );
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

  const bot = botGuardError(body);
  if (bot) {
    return NextResponse.json({ message: bot }, { status: 400 });
  }

  const parsed = DemoBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: fieldErrors(parsed) },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const row = await createDemoBooking({
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    courseSlug: data.course,
    preferredDate: data.preferredDate.trim(),
    preferredTime: data.preferredTime.trim(),
    message: data.message || null,
  });

  publishEvent({ table: "demo_bookings", at: Date.now() });

  after(async () => {
    await notifyAdmins({
      kind: "demo-booking",
      title: "New demo booking",
      message: `${data.name.trim()} booked a ${data.course} demo for ${data.preferredDate} at ${data.preferredTime}.`,
      href: "/admin-panel",
    });

    await sendDemoBookingConfirmationEmail({
      to: data.email.trim(),
      name: data.name.trim(),
      course: data.course,
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
    });

    const emails = await listAdminEmails();
    await Promise.all(
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

  // Student's WhatsApp deep link (they open it to confirm / ask questions).
  const digits = data.phone.replace(/[^\d]/g, "");
  const whatsappLink = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(
        `Hi Language Hub! I just booked a ${data.course} demo on ${data.preferredDate} at ${data.preferredTime}. Looking forward to it!`
      )}`
    : "";

  return NextResponse.json(
    {
      id: row.id,
      ok: true,
      status: row.status,
      whatsappLink,
      confirmation: {
        course: data.course,
        date: data.preferredDate,
        time: data.preferredTime,
      },
    },
    { status: 201 }
  );
}
