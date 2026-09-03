import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  sendAbandonedApplicationEmail,
  sendPaymentReminderEmail,
  sendSequenceStep2Email,
  emailConfigured,
} from "@/lib/email";
import { formatPKR } from "@/lib/course-data";
import { createDedupTracker } from "@/lib/automation-dedup";

export const dynamic = "force-dynamic";

/**
 * Email automation engine.
 *
 * Triggered by an external cron (e.g. Vercel Cron, GitHub Actions on a timer,
 * or a platform scheduler) hitting this endpoint, OR by the instrumented
 * in-process interval. It scans for records that are "due" a nudge and sends
 * them, tracking each send in the `automation_sends` collection so nothing is
 * emailed twice.
 *
 * Returns a summary of what was sent so a cron job can log it.
 */
export async function GET(request: Request) {
  // Guard: only allow if a shared secret is configured and matches (prevents
  // random internet callers from firing emails).
  const secret = process.env.AUTOMATION_SECRET ?? "";
  const url = new URL(request.url);
  const token = url.searchParams.get("secret");
  if (secret && token !== secret) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }
  // If no secret is configured, still allow (dev/non-sensitive mode) but only
  // proceed if email is actually configured, to avoid meaningless dev hits.
  if (!emailConfigured()) {
    return NextResponse.json({ ok: true, sent: 0, reason: "email-not-configured" });
  }

  const db = await getDb();
  const sends = db.collection<{
    key: string;
    kind: string;
    sentAt: Date;
  }>("automation_sends");
  const now = new Date();

  // Dedup via a tiny store backed by the collection (unique-index race is
  // swallowed by insertOne in markSent) — keeps every send to one email/one
  // automation from firing twice.
  const dedup = createDedupTracker({
    has: async (key) => !!(await sends.findOne({ key })),
    add: async (key) => {
      try {
        await sends.insertOne({ key, kind: "dedup", sentAt: now });
      } catch {
        // unique index race — fine, another tick already sent it
      }
    },
  });

  const sent: Array<{ kind: string; to: string }> = [];

  // ---------- 1. Abandoned applications ----------
  // Users who signed up >= 3 days ago, have no application, and haven't been nudged.
  const users = db.collection("users");
  const candidates = await users
    .find({
      role: { $ne: "ADMIN" },
      createdAt: { $lte: new Date(now.getTime() - 3 * 86400000) },
    })
    .project({ email: 1, name: 1, createdAt: 1 })
    .limit(2000)
    .toArray();

  for (const u of candidates) {
    const email = (u.email as string) ?? "";
    if (!email) continue;
    const daysAgo = Math.max(1, Math.floor((now.getTime() - new Date(u.createdAt as Date).getTime()) / 86400000));

    // Skip if they already applied.
    const appCount = await db.collection("applications").countDocuments({ email });
    if (appCount > 0) continue;

    const key = `abandoned:${email.toLowerCase()}`;
    if (await dedup.alreadySent(key)) continue;

    await sendAbandonedApplicationEmail({ to: email, name: u.name, daysAgo });
    await dedup.markSent(key);
    sent.push({ kind: "abandoned_application", to: email });
  }

  // ---------- 2. Payment reminders ----------
  // Enrollments stuck in AWAITING_PAYMENT for >= 2 days.
  const enrollments = db.collection("enrollments");
  const paymentStuck = await enrollments
    .find({
      status: "AWAITING_PAYMENT",
      updatedAt: { $lte: new Date(now.getTime() - 2 * 86400000) },
    })
    .project({ email: 1, name: 1, subjects: 1, updatedAt: 1 })
    .limit(1000)
    .toArray();

  for (const e of paymentStuck) {
    const email = (e.email as string) ?? "";
    if (!email) continue;
    const daysAgo = Math.max(1, Math.floor((now.getTime() - new Date(e.updatedAt as Date).getTime()) / 86400000));
    const key = `payment:${email.toLowerCase()}`;
    if (await dedup.alreadySent(key)) continue;

    const subjects = Array.isArray(e.subjects) ? (e.subjects as string[]) : [];
    const course = subjects[0];
    // Approximate amount from the course fee.
    const courseDoc = course
      ? await db.collection("courses").findOne({ name: course })
      : null;
    const amount = courseDoc?.fee ? formatPKR(courseDoc.fee as number) : undefined;

    await sendPaymentReminderEmail({
      to: email,
      name: e.name,
      course,
      amountLabel: amount,
      daysAgo,
    });
    await dedup.markSent(key);
    sent.push({ kind: "payment_reminder", to: email });
  }

  // ---------- 3. Welcome sequence step 2 ----------
  // Users who signed up 24–72h ago and got step 1 (welcome) but haven't applied.
  const seqCandidates = await users
    .find({
      role: { $ne: "ADMIN" },
      createdAt: {
        $gte: new Date(now.getTime() - 72 * 3600000),
        $lte: new Date(now.getTime() - 24 * 3600000),
      },
    })
    .project({ email: 1, name: 1 })
    .limit(2000)
    .toArray();

  for (const u of seqCandidates) {
    const email = (u.email as string) ?? "";
    if (!email) continue;
    const appCount = await db.collection("applications").countDocuments({ email });
    if (appCount > 0) continue;
    const key = `seq2:${email.toLowerCase()}`;
    if (await dedup.alreadySent(key)) continue;

    await sendSequenceStep2Email({ to: email, name: u.name });
    await dedup.markSent(key);
    sent.push({ kind: "welcome_sequence_2", to: email });
  }

  return NextResponse.json({ ok: true, sent, count: sent.length });
}
