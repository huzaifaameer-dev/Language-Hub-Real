import { NextResponse, after } from "next/server";

import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { q } from "@/lib/server/pg";
import { newId } from "@/lib/server/id";
import { notifyAdmins } from "@/lib/notifications";
import { sendEmail, emailConfigured } from "@/lib/email";
import { appBaseUrl } from "@/lib/base-url";
import { botGuardError } from "@/lib/bot-check";

export const dynamic = "force-dynamic";

/** Public placement-test lead capture: stores the result, alerts admins and
 *  (when SMTP is configured) emails the student their level + recommendation. */
export async function POST(request: Request) {
  const rl = await rateLimitDb(
    await clientKey(request, "placement-test"),
    10,
    60 * 60 * 1000
  );
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
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

  const { name, email, score, total, level, recommendedCourse } = body as {
    name?: string;
    email?: string;
    score?: number;
    total?: number;
    level?: string;
    recommendedCourse?: string;
  };

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ message: "Valid email is required." }, { status: 400 });
  }

  const cleanName = (name || "").trim();
  const cleanEmail = email.trim().toLowerCase();

  await q(
    `INSERT INTO placement_test_leads
       (id, name, email, score, total, level, recommended_course)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      newId(),
      cleanName,
      cleanEmail,
      Number.isFinite(score) ? score : null,
      Number.isFinite(total) ? total : null,
      level ?? null,
      recommendedCourse ?? null,
    ]
  );

  after(async () => {
    await notifyAdmins({
      kind: "placement-test",
      title: "New placement test lead",
      message: `${cleanName || "Someone"} scored ${score}/${total} (${level}) and was recommended ${recommendedCourse}.`,
      href: "/admin-panel?tab=leads",
    });
  });

  if (emailConfigured()) {
    const firstName = (cleanName || "there").split(" ")[0];
    after(async () => {
      await sendEmail({
        to: cleanEmail,
        subject: "Your English level test results — Language Hub",
        text: `Hi ${firstName}, you scored ${score}/${total} (${level}). We recommend: ${recommendedCourse}. Apply now: ${appBaseUrl()}/signup`,
        html: `<!doctype html>
<html><body style="margin:0;padding:0;background:#eef5f2;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef5f2;padding:28px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e3ede9">
  <tr><td style="padding:26px 30px;background:linear-gradient(135deg,#0f6b5c,#14a08c);color:#ffffff">
    <p style="margin:0;font-size:11px;letter-spacing:.25em;font-weight:bold;text-transform:uppercase;color:#cdebe3">Language Hub</p>
    <p style="margin:4px 0 0;font-size:20px;font-weight:bold">Your placement test results</p>
  </td></tr>
  <tr><td style="padding:28px 30px;color:#47615b;font-size:15px;line-height:1.6">
    <p>Hi ${firstName},</p>
    <p style="font-weight:600;margin:0 0 10px">You scored ${score}/${total} — level: ${level}</p>
    <p style="margin:0 0 14px">Based on your results we recommend: <strong>${recommendedCourse}</strong></p>
    <p><a href="${appBaseUrl()}/signup" style="display:inline-block;background:#0f6b5c;color:#ffffff;text-decoration:none;border-radius:9999px;padding:11px 22px;font-weight:bold">Apply now</a></p>
    <p style="color:#93aaa4;font-size:13px;margin-top:14px">or copy: ${appBaseUrl()}/signup</p>
  </td></tr>
  <tr><td style="padding:18px 30px 26px;border-top:1px solid #eef5f2;color:#93aaa4;font-size:12px">
    <p style="margin:0">You received this because you took the placement test on Language Hub.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
      });
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
