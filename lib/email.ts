import nodemailer from "nodemailer";
import { appBaseUrl } from "@/lib/base-url";

const ENV = {
  host: process.env.SMTP_HOST ?? "",
  port: Number(process.env.SMTP_PORT ?? 587),
  user: process.env.SMTP_USER ?? "",
  pass: process.env.SMTP_PASS ?? "",
  from: process.env.MAIL_FROM ?? "Language Hub <noreply@language-hub.local>",
};

/** True when SMTP creds are present, so links silently work once deployed. */
export function emailConfigured(): boolean {
  return !!(ENV.host && ENV.user && ENV.pass);
}

export { appBaseUrl };

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: ENV.host,
      port: ENV.port,
      secure: ENV.port === 465,
      auth: { user: ENV.user, pass: ENV.pass },
    });
  }
  return transporter;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Optional binary attachments (e.g. a generated registration PDF). */
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
}

export interface SendEmailResult {
  ok: boolean;
  skipped?: boolean;
  devLink?: string | null;
}

/**
 * Sends an email. When SMTP is not configured:
 *  - development: the message is logged and - for link-based emails - the
 *    resolved link is returned so flows stay testable end to end.
 *  - production: returns skipped silently (no crash, no enumeration signal).
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!emailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email:dev] to=${input.to} subject="${input.subject}"`);
    }
    return { ok: false, skipped: true };
  }
  try {
    await getTransporter().sendMail({
      from: ENV.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] send failed:", (err as Error).message);
    return { ok: false };
  }
}

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#eef1f9;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f9;padding:28px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0">
  <tr><td style="padding:26px 30px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#ffffff">
    <p style="margin:0;font-size:11px;letter-spacing:.25em;font-weight:bold;text-transform:uppercase;color:#e0e7ff">Language Hub</p>
    <p style="margin:4px 0 0;font-size:20px;font-weight:bold">${title}</p>
  </td></tr>
  <tr><td style="padding:28px 30px;color:#334155;font-size:15px;line-height:1.6">
    ${bodyHtml}
  </td></tr>
  <tr><td style="padding:18px 30px 26px;border-top:1px solid #f1f5f9;color:#94a3b8;font-size:12px">
    <p style="margin:0">You received this email because you have an account on Language Hub.

If this wasn't you, you can safely ignore it.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/** Admin alert when a new application arrives. */
export async function sendNewApplicationEmail(input: {
  to: string;
  applicant: string;
  course: string;
}): Promise<SendEmailResult> {
  const link = `${appBaseUrl()}/admin-panel`;
  return sendEmail({
    to: input.to,
    subject: `New application: ${input.applicant} → ${input.course}`,
    text: `${input.applicant} applied for ${input.course}. Review it at ${link}`,
    html: shell(
      "New application",
      `<p style="font-weight:600;margin:0 0 10px">${input.applicant} applied for ${input.course}.</p>
      <p><a href="${link}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:9999px;padding:11px 22px;font-weight:bold">Open the admin panel</a></p>`
    ),
  });
}

/** Admin alert when a new demo-class booking arrives. */
export async function sendNewDemoBookingEmail(input: {
  to: string;
  name: string;
  course: string;
  preferredDate: string;
  preferredTime: string;
}): Promise<SendEmailResult> {
  const link = `${appBaseUrl()}/admin-panel`;
  return sendEmail({
    to: input.to,
    subject: `New demo booking: ${input.name} · ${input.course}`,
    text: `${input.name} booked a ${input.course} demo on ${input.preferredDate} at ${input.preferredTime}. Review it at ${link}`,
    html: shell(
      "New demo booking",
      `<p style="font-weight:600;margin:0 0 10px">${input.name} booked a ${input.course} demo class.</p>
      <p style="margin:0 0 4px"><strong>Date:</strong> ${input.preferredDate}</p>
      <p style="margin:0 0 4px"><strong>Time:</strong> ${input.preferredTime}</p>
      <p style="margin:0 0 14px"><strong>Course:</strong> ${input.course}</p>
      <p><a href="${link}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:9999px;padding:11px 22px;font-weight:bold">Open the admin panel</a></p>`
    ),
  });
}

/** Instant confirmation email sent to the student after booking a demo class. */
export async function sendDemoBookingConfirmationEmail(input: {
  to: string;
  name: string;
  course: string;
  preferredDate: string;
  preferredTime: string;
}): Promise<SendEmailResult> {
  const first = input.name.split(" ")[0];
  const link = `${appBaseUrl()}/courses`;
  return sendEmail({
    to: input.to,
    subject: `Demo class confirmed — ${input.course} | Language Hub`,
    text: `Hi ${first}, your ${input.course} demo is confirmed for ${input.preferredDate} at ${input.preferredTime}. We'll see you there!`,
    html: shell("Demo class confirmed!", `
      <p>Hi ${first},</p>
      <p style="font-weight:600;margin:0 0 10px">Your free demo class is confirmed!</p>
      <table role="presentation" style="width:100%;margin:0 0 14px">
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:90px"><strong>Course</strong></td><td style="padding:8px 0;font-size:15px;font-weight:600">${input.course}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px"><strong>Date</strong></td><td style="padding:8px 0;font-size:15px;font-weight:600">${input.preferredDate}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:13px"><strong>Time</strong></td><td style="padding:8px 0;font-size:15px;font-weight:600">${input.preferredTime}</td></tr>
      </table>
      <p>Our teacher will reach out to you shortly with the meeting link. In the meantime, feel free to explore our courses:</p>
      <p><a href="${link}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:9999px;padding:11px 22px;font-weight:bold">View all courses</a></p>
      <p style="color:#94a3b8;font-size:13px;margin-top:14px">Need to reschedule? Just reply to this email or message us on WhatsApp.</p>
    `),
  });
}

/** Student-facing outcome email when an admin confirms or declines a demo. */
export async function sendDemoBookingDecisionEmail(input: {
  to: string;
  name: string;
  confirmed: boolean;
  course: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
}): Promise<SendEmailResult> {
  const first = input.name.split(" ")[0];
  const label = input.confirmed
    ? "Your demo class is confirmed"
    : "Update on your demo class";
  const bodyHtml = `
    <p>Hi ${first},</p>
    <p style="font-weight:600;margin:0 0 10px">${label}.</p>
    <p style="margin:0 0 4px"><strong>Course:</strong> ${input.course}</p>
    <p style="margin:0 0 4px"><strong>Date:</strong> ${input.preferredDate}</p>
    <p style="margin:0 0 4px"><strong>Time:</strong> ${input.preferredTime}</p>
    ${input.message ? `<p>${input.message}</p>` : ""}
    <p>If you have any questions, simply reply to this email.</p>
  `;
  return sendEmail({
    to: input.to,
    subject: `Language Hub · ${label}`,
    text: `${label} for your ${input.course} demo on ${input.preferredDate} at ${input.preferredTime}.${input.message ? ` ${input.message}` : ""}`,
    html: shell(label, bodyHtml),
  });
}

/** Decision emails (application approved/rejected, enrollment confirmed/declined). */
export async function sendDecisionEmail(input: {
  to: string;
  name?: string;
  kind: "application" | "enrollment";
  approved: boolean;
  subject: string;
  message?: string;
  href: string;
}): Promise<SendEmailResult> {
  const first = (input.name ?? "there").split(" ")[0];
  const label =
    input.kind === "application"
      ? input.approved
        ? "Your application was approved"
        : "Update on your application"
      : input.approved
        ? "Your enrollment is confirmed"
        : "Your enrollment request was declined";

  const bodyHtml = `
    <p>Hi ${first},</p>
    <p style="font-weight:600;margin:0 0 10px">${label}.</p>
    ${input.message ? `<p>${input.message}</p>` : ""}
    <p><a href="${appBaseUrl()}${input.href}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:9999px;padding:11px 22px;font-weight:bold">Open your dashboard</a></p>
    <p style="color:#94a3b8;font-size:13px">or copy: ${appBaseUrl()}${input.href}</p>
  `;

  return sendEmail({
    to: input.to,
    subject: input.subject,
    text: `${label}.${input.message ? ` ${input.message}` : ""} ${appBaseUrl()}${input.href}`,
    html: shell(label, bodyHtml),
  });
}

/** Password reset link email. Returns the link in dev when SMTP is off. */
export async function sendResetEmail(input: {
  to: string;
  name?: string;
  token: string;
}): Promise<SendEmailResult> {
  const link = `${appBaseUrl()}/reset-password?token=${input.token}`;
  const first = (input.name ?? "there").split(" ")[0];

  const result = await sendEmail({
    to: input.to,
    subject: "Reset your Language Hub password",
    text: `Hi ${first}, use this link to reset your password — it expires in 30 minutes:\n${link}`,
    html: shell("Reset your password", `
      <p>Hi ${first},</p>
      <p>We got a request to reset your password. The link below expires in 30 minutes.</p>
      <p><a href="${link}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:9999px;padding:11px 22px;font-weight:bold">Choose a new password</a></p>
      <p style="color:#94a3b8;font-size:13px">or copy: ${link}</p>
      <p style="color:#94a3b8;font-size:13px">If you didn't request this, ignore this email.</p>
    `),
  });

  if (result.skipped && process.env.NODE_ENV !== "production") {
    return { ...result, devLink: link };
  }
  return result;
}

/** Welcome email on sign-up. Optionally carries an email-verification link. */
export async function sendWelcomeEmail(input: {
  to: string;
  name?: string;
  verifyToken?: string;
}): Promise<SendEmailResult> {
  const first = (input.name ?? "there").split(" ")[0];
  const verifyLink = input.verifyToken
    ? `${appBaseUrl()}/verify-email?token=${input.verifyToken}`
    : null;

  return sendEmail({
    to: input.to,
    subject: "Welcome to Language Hub",
    text: `Hi ${first}, welcome to Language Hub! Your account is ready — explore the dashboard and apply for a course.${verifyLink ? `\nConfirm your email: ${verifyLink}` : ""}`,
    html: shell("Welcome aboard", `
      <p>Hi ${first},</p>
      <p>Your Language Hub account is ready.</p>
      <p>Apply for a course, pick your batch, and start building your English journey with us.</p>
      ${verifyLink ? `<p>Please confirm your email so we can keep you posted:</p><p><a href="${verifyLink}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:9999px;padding:11px 22px;font-weight:bold">Confirm your email</a></p>` : ""}
      <p><a href="${appBaseUrl()}/dashboard" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:9999px;padding:11px 22px;font-weight:bold">Open your dashboard</a></p>
    `),
  });
}

/* ------------------------------------------------------------------ */
/*  Feature 20: Email automations — sequences + recovery reminders     */
/* ------------------------------------------------------------------ */

/** Ends the welcome sequence: "your next step" nudge to apply for a course. */
export async function sendSequenceStep2Email(input: {
  to: string;
  name?: string;
}): Promise<SendEmailResult> {
  const first = (input.name ?? "there").split(" ")[0];
  return sendEmail({
    to: input.to,
    subject: "Your next step at Language Hub",
    text: `Hi ${first}, you're one step from starting. Apply for a course and we'll get back within 12 hours.`,
    html: shell("Almost there", `
      <p>Hi ${first},</p>
      <p>Great to have you on board. We noticed you haven't applied for a course yet — that's the fastest way to lock in your seat and start classes.</p>
      <p><a href="${appBaseUrl()}/dashboard" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:9999px;padding:11px 22px;font-weight:bold">Apply for a course</a></p>
      <p style="color:#94a3b8;font-size:13px;margin-top:14px">Applications are reviewed within 12 hours.</p>
    `),
  });
}

/** Recovery: user created an account but never applied (abandoned application). */
export async function sendAbandonedApplicationEmail(input: {
  to: string;
  name?: string;
  daysAgo: number;
}): Promise<SendEmailResult> {
  const first = (input.name ?? "there").split(" ")[0];
  return sendEmail({
    to: input.to,
    subject: "Complete your Language Hub application",
    text: `Hi ${first}, you started signing up ${input.daysAgo} day${input.daysAgo !== 1 ? "s" : ""} ago but didn't finish. Ready to pick your course?`,
    html: shell("Finish your application", `
      <p>Hi ${first},</p>
      <p>You started your Language Hub sign-up ${input.daysAgo} day${input.daysAgo !== 1 ? "s" : ""} ago but didn't finish. Batches fill quickly — don't miss out on your preferred time slot.</p>
      <p><a href="${appBaseUrl()}/signup" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:9999px;padding:11px 22px;font-weight:bold">Complete sign-up</a></p>
      <p style="color:#94a3b8;font-size:13px;margin-top:14px">It only takes a minute and seats are confirmed on a first-come basis.</p>
    `),
  });
}

/** Recovery: enrollment approved but payment not completed (payment reminder). */
export async function sendPaymentReminderEmail(input: {
  to: string;
  name?: string;
  course?: string;
  amountLabel?: string;
  daysAgo: number;
}): Promise<SendEmailResult> {
  const first = (input.name ?? "there").split(" ")[0];
  const course = input.course ? ` for ${input.course}` : "";
  return sendEmail({
    to: input.to,
    subject: "Reminder: complete your payment to secure your seat",
    text: `Hi ${first}, your seat${course} is being held, but we haven't received your payment yet ${input.daysAgo} day${input.daysAgo !== 1 ? "s" : ""} after confirmation. Please complete it to lock in your place.`,
    html: shell("Payment reminder", `
      <p>Hi ${first},</p>
      <p>Your seat${course} is being held for you, but we haven't received payment yet ${input.daysAgo} day${input.daysAgo !== 1 ? "s" : ""} after we confirmed it.</p>
      ${input.amountLabel ? `<p style="font-weight:600">Amount due: ${input.amountLabel}</p>` : ""}
      <p><a href="${appBaseUrl()}/dashboard" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:9999px;padding:11px 22px;font-weight:bold">Complete your payment</a></p>
      <p style="color:#94a3b8;font-size:13px;margin-top:14px">If we don't hear back, your seat may be released to the next student on the waitlist.</p>
    `),
  });
}

/* ------------------------------------------------------------------ */
/*  Course registration emails (PDF summary + 24h acknowledgment)     */
/* ------------------------------------------------------------------ */

export interface RegistrationEmailPayload {
  to: string;
  studentName: string;
  course: string;
  ref: string;
  pdf: Buffer;
  /** Extra attachments — usually the original payment receipt. */
  extraAttachments?: Array<{ filename: string; content: Buffer; contentType?: string }> | null;
  /** True when this email is the admin inbox digest. */
  adminCopy?: boolean;
}

/**
 * Emails a course-registration PDF summary. Used for the admin inbox digest
 * (with the receipt attached when one was uploaded) and for the student's
 * "send me a copy of my responses" confirmation.
 */
export async function sendRegistrationEmail(
  input: RegistrationEmailPayload
): Promise<SendEmailResult> {
  const { to, studentName, course, ref, pdf } = input;
  const first = studentName.split(" ")[0] || "there";

  const attachments: NonNullable<SendEmailInput["attachments"]> = [
    { filename: `${ref}-${course.replace(/[^a-z0-9]+/gi, "-")}.pdf`.toLowerCase(), content: pdf, contentType: "application/pdf" },
  ];
  for (const a of input.extraAttachments ?? []) {
    attachments.push({ filename: a.filename, content: a.content, contentType: a.contentType });
  }

  const subject = input.adminCopy
    ? `New course registration — ${studentName} · ${course} (${ref})`
    : `Your ${course} registration — ${ref} | Language Hub`;

  return sendEmail({
    to,
    subject,
    text: input.adminCopy
      ? `${studentName} registered for ${course}. Reference ${ref}. The full PDF summary is attached.`
      : `Hi ${first}, your ${course} registration has been received. Reference ${ref}. Our team will reply within 24 hours. Your responses are attached.`,
    html: input.adminCopy
      ? shell("New course registration", `
        <p style="font-weight:600;margin:0 0 12px">${studentName} just registered for <strong>${course}</strong>.</p>
        <table role="presentation" style="width:100%;margin:0 0 16px">
          <tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:130px">Reference</td><td style="padding:6px 0;font-weight:700">${ref}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Course</td><td style="padding:6px 0;font-weight:600">${course}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Student</td><td style="padding:6px 0;font-weight:600">${studentName}</td></tr>
        </table>
        <p>The full registration summary (with photo and payment details) is attached as a PDF.
        ${input.extraAttachments?.length ? "The original payment receipt is attached as well." : ""}</p>
        <p><a href="${appBaseUrl()}/admin-panel" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:9999px;padding:11px 22px;font-weight:bold">Open the admin panel</a></p>
      `)
      : shell("Registration received — we'll reply within 24 hours", `
        <p>Hi ${first},</p>
        <p style="font-weight:600">Your <strong>${course}</strong> registration has been received.</p>
        <p>Reference: <strong>${ref}</strong></p>
        <p>Our team reviews every registration within <strong>24 hours</strong> and will reach out to you on WhatsApp or email to confirm your seat and next steps.</p>
        <p>Your responses are attached as a PDF — keep it for your records.</p>
        <p style="color:#94a3b8;font-size:13px">Every language journey begins with one small step. See you in class!</p>
      `),
    attachments,
  });
}