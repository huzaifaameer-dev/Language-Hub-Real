import nodemailer from "nodemailer";

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

export function appBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.BASE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

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