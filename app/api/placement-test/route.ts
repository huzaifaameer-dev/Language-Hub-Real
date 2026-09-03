import { NextResponse } from "next/server";

import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { getDb } from "@/lib/db";
import { notifyAdmins, listAdminEmails } from "@/lib/notifications";
import { sendEmail, emailConfigured } from "@/lib/email";
import { appBaseUrl } from "@/lib/base-url";

/**
 * Public endpoint for placement test lead capture. Stores the result and
 * optionally sends the student their results + notifies admins.
 */
export async function POST(request: Request) {
  const rl = await rateLimitDb(await clientKey(request, "placement-test"), 10, 60 * 60 * 1000);
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

  const db = await getDb();
  const leads = db.collection("placement_test_leads");

  const now = new Date();
  await leads.insertOne({
    name: (name || "").trim(),
    email: email.trim().toLowerCase(),
    score: score ?? null,
    total: total ?? null,
    level: level ?? null,
    recommendedCourse: recommendedCourse ?? null,
    createdAt: now,
  });

  // Notify admins about the lead
  await notifyAdmins({
    kind: "placement-test",
    title: "New placement test lead",
    message: `${(name || "Someone").trim()} scored ${score}/${total} (${level}) and was recommended ${recommendedCourse}.`,
    href: "/admin-panel",
  });

  // Send results email to the student (best-effort)
  if (emailConfigured()) {
    void listAdminEmails().then(() => {
      void sendEmail({
        to: email!.trim(),
        subject: `Your English Level Test Results — Language Hub`,
        text: `Hi ${(name || "there").trim()}, you scored ${score}/${total} (${level}). We recommend: ${recommendedCourse}. Apply now: ${appBaseUrl()}/signup`,
        html: `<!doctype html>
<html><body style="margin:0;padding:0;background:#eef1f9;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f9;padding:28px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0">
  <tr><td style="padding:26px 30px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#ffffff">
    <p style="margin:0;font-size:11px;letter-spacing:.25em;font-weight:bold;text-transform:uppercase;color:#e0e7ff">Language Hub</p>
    <p style="margin:4px 0 0;font-size:20px;font-bold">Your Placement Test Results</p>
  </td></tr>
  <tr><td style="padding:28px 30px;color:#334155;font-size:15px;line-height:1.6">
    <p>Hi ${(name || "there").split(" ")[0]},</p>
    <p style="font-weight:600;margin:0 0 10px">You scored ${score}/${total} — Level: ${level}</p>
    <p style="margin:0 0 14px">Based on your results, we recommend: <strong>${recommendedCourse}</strong></p>
    <p><a href="${appBaseUrl()}/signup" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:9999px;padding:11px 22px;font-weight:bold">Apply now</a></p>
    <p style="color:#94a3b8;font-size:13px;margin-top:14px">or copy: ${appBaseUrl()}/signup</p>
  </td></tr>
  <tr><td style="padding:18px 30px 26px;border-top:1px solid #f1f5f9;color:#94a3b8;font-size:12px">
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
