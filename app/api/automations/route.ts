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
import { notify, notifyAdmins } from "@/lib/notifications";
import { sendWaText, waConfigured } from "@/lib/whatsapp";
import { staleLearners, weekKey, nudgeCopy, digestCopy } from "@/lib/growth/streaks";
import { completionPercent, makeCertificateId, shouldIssueCertificate, issueDate } from "@/lib/growth/certificate";
import { runAgentRound } from "@/lib/ai/agent/engine";

export const dynamic = "force-dynamic";

/**
 * Automation engine (cron). Scans for records "due" a nudge and fires email /
 * WhatsApp / in-app notifications + seat-release and certificate steps. Every
 * send is tracked in `automation_sends` so nothing fires twice. Individual
 * channels are guarded by their own config (SMTP / WhatsApp), in-app
 * notifications work without any external service.
 */
/** Resolve the automation secret from header (preferred) or query param. */
function automationSecretOk(request: Request): boolean {
  const secret = process.env.AUTOMATION_SECRET ?? "";
  if (!secret) return true;
  const auth = request.headers.get("authorization");
  const headerTok =
    auth?.startsWith("Bearer ") ? auth.slice(7) : request.headers.get("x-automation-secret");
  const url = new URL(request.url);
  const queryTok = url.searchParams.get("secret");
  const given = [headerTok, queryTok].map((t) => (t ?? "").trim()).find(Boolean);
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && a.equals(b) && given === secret;
}

export async function GET(request: Request) {
  if (!automationSecretOk(request)) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const db = await getDb();
  const sends = db.collection<{ key: string; kind: string; sentAt: Date }>("automation_sends");
  const now = new Date();
  const dedup = createDedupTracker({
    has: async (key) => !!(await sends.findOne({ key })),
    add: async (key) => {
      try {
        await sends.insertOne({ key, kind: "dedup", sentAt: now });
      } catch {
        // unique-index race — another tick already sent it
      }
    },
  });

  const doEmail = emailConfigured();
  const doWa = waConfigured();
  const sent: Array<{ kind: string; to: string }> = [];
  const users = db.collection("users");

  /* ---------- 1. Abandoned applications (users without an application) ---------- */
  {
    const candidates = await users
      .find({ role: { $ne: "ADMIN" }, createdAt: { $lte: new Date(now.getTime() - 3 * 86400000) } })
      .project({ email: 1, name: 1, phone: 1, createdAt: 1 })
      .limit(2000)
      .toArray();

    for (const u of candidates) {
      const email = (u.email as string) ?? "";
      if (!email) continue;
      const daysAgo = Math.max(1, Math.floor((now.getTime() - new Date(u.createdAt as Date).getTime()) / 86400000));
      const appCount = await db.collection("applications").countDocuments({ email });
      if (appCount > 0) continue;
      const key = `abandoned:${email.toLowerCase()}`;
      if (await dedup.alreadySent(key)) continue;

      // WhatsApp first when a phone is on file, else email.
      let sentTo: string | null = null;
      const phone = String(u.phone ?? "").trim();
      if (doWa && phone) {
        const first = String(u.name ?? "there").split(" ")[0];
        const body = `Salam ${first}! You created a Language Hub account but didn't apply yet — batched fill fast. Tap into your dashboard to pick a course and we'll hold your spot. 🙌`;
        const res = await sendWaText({ to: phone, text: body });
        if (res.ok) sentTo = phone;
      }
      if (!sentTo) {
        if (!doEmail) continue;
        await sendAbandonedApplicationEmail({ to: email, name: u.name, daysAgo });
        sentTo = email;
      }
      await dedup.markSent(key);
      sent.push({ kind: "abandoned_application", to: sentTo });
    }
  }

  /* ---------- 2. Payment reminders (AWAITING_PAYMENT stuck >= 2 days) ---------- */
  if (doEmail) {
    const paymentStuck = await db
      .collection("enrollments")
      .find({ status: "AWAITING_PAYMENT", updatedAt: { $lte: new Date(now.getTime() - 2 * 86400000) } })
      .project({ email: 1, name: 1, subjects: 1, updatedAt: 1 })
      .limit(1000)
      .toArray();

    for (const e of paymentStuck) {
      const email = (e.email as string) ?? "";
      if (!email) continue;
      const daysAgo = Math.max(1, Math.floor((now.getTime() - new Date(e.updatedAt as Date).getTime()) / 86400000));
      const key = `payment:${email.toLowerCase()}`;
      if (await dedup.alreadySent(key)) continue;
      const course = Array.isArray(e.subjects) ? (e.subjects as string[])[0] : undefined;
      const courseDoc = course ? await db.collection("courses").findOne({ name: course }) : null;
      await sendPaymentReminderEmail({
        to: email,
        name: e.name,
        course,
        amountLabel: courseDoc?.fee ? formatPKR(courseDoc.fee as number) : undefined,
        daysAgo,
      });
      await dedup.markSent(key);
      sent.push({ kind: "payment_reminder", to: email });
    }
  }

  /* ---------- 3. Welcome sequence step 2 (24–72h, not yet applied) ---------- */
  if (doEmail) {
    const seqCandidates = await users
      .find({ role: { $ne: "ADMIN" }, createdAt: { $gte: new Date(now.getTime() - 72 * 3600000), $lte: new Date(now.getTime() - 24 * 3600000) } })
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
  }

  /* ---------- 4. Demo reminders (booking pending > 2h, once) ---------- */
  const demos = await db
    .collection("demo_bookings")
    .find({
      status: { $in: ["PENDING", "CONFIRMED"] },
      createdAt: { $lte: new Date(now.getTime() - 2 * 3600000) },
    })
    .project({ name: 1, email: 1, phone: 1, course: 1, preferredDate: 1, preferredTime: 1, _id: 1 })
    .limit(500)
    .toArray();
  for (const d of demos) {
    const key = `demo-remind:${String(d._id)}`;
    if (await dedup.alreadySent(key)) continue;
    const first = (d.name as string ?? "").split(" ")[0] || "there";
    const text = `Hi ${first}, a quick reminder about your ${d.course} demo (${d.preferredDate} · ${d.preferredTime}). Reply to confirm and we'll send the meeting link early. — Language Hub`;
    if (doWa && d.phone) {
      await sendWaText({ to: String(d.phone), text });
      await dedup.markSent(key);
      sent.push({ kind: "demo_reminder", to: String(d.phone) });
    } else if (doEmail && d.email) {
      const { sendEmail } = await import("@/lib/email");
      await sendEmail({
        to: String(d.email),
        subject: `Reminder · your ${d.course} demo`,
        text,
        html: `<div style="font-family:Arial;line-height:1.6;color:#334155"><p>${text.replace(/\n/g, "<br/>")}</p></div>`,
      });
      await dedup.markSent(key);
      sent.push({ kind: "demo_reminder", to: String(d.email) });
    } else {
      await notifyAdmins({ kind: "demo-remind", title: `Demo follow-up: ${d.name}`, message: text, href: "/admin-panel" });
      await dedup.markSent(key);
      sent.push({ kind: "demo_reminder", to: String(d._id) });
    }
  }

  /* ---------- 5. Stuck WhatsApp funnels (started, not finished) ---------- */
  if (doWa) {
    const stuck = await db
      .collection("whatsapp_leads")
      .find({ "flow.stage": { $nin: [null, "done"] }, createdAt: { $lte: new Date(now.getTime() - 2 * 3600000) } })
      .project({ phone: 1, flow: 1, _id: 1 })
      .limit(300)
      .toArray();
    for (const w of stuck) {
      const key = `wa-reengage:${String(w._id)}`;
      if (await dedup.alreadySent(key)) continue;
      await sendWaText({
        to: String(w.phone),
        text: "Hey, you were choosing a course with us! Reply with 1 (Spoken), 2 (IELTS), 3 (PTE) or 4 (Duolingo) and I'll help you pick your batch time. 🙂",
      });
      await dedup.markSent(key);
      sent.push({ kind: "wa_reengage", to: String(w.phone) });
    }
  }

  /* ---------- 6. Waitlist: seat freed → notify hold; expire old holds ---------- */
  const enrolled = await db
    .collection("enrollments")
    .find({ status: "ENROLLED" })
    .project({ batch: 1, subjects: 1, userId: 1, email: 1, name: 1 })
    .limit(4000)
    .toArray();
  const pendingApps = await db
    .collection("applications")
    .find({ status: "PENDING", waitlistHoldUntil: null })
    .project({ userId: 1, name: 1, course: 1, createdAt: 1 })
    .limit(2000)
    .toArray();

  // Compute live seats per (course, batch) and match against pending applicants.
  const courseDocs = await db.collection("courses").find({ active: true }).project({ name: 1, batches: 1 }).toArray();
  for (const doc of courseDocs) {
    const batches = (doc.batches ?? []) as Array<{ name: string; seatsTotal: number }>;
    for (const b of batches) {
      const used = enrolled.filter(
        (e) => (e.subjects ?? []).includes(doc.name) && e.batch === b.name
      ).length;
      const seatsLeft = Math.max(0, (b.seatsTotal ?? 0) - used);
      if (seatsLeft <= 0) continue;
      for (const app of pendingApps) {
        if (app.course !== doc.name) continue;
        const key = `wlist:${String(app._id)}`;
        if (await dedup.alreadySent(key)) continue;
        const holdUntil = new Date(now.getTime() + 24 * 3600000);
        try {
          await notify(app.userId, {
            kind: "seat-open",
            title: `A seat opened in ${doc.name}`,
            message: `The ${b.name} batch has a free seat. Apply now to claim it within 24 hours.`,
            href: "/dashboard",
          });
          await db.collection("applications").updateOne({ _id: app._id }, { $set: { waitlistHoldUntil: holdUntil, updatedAt: now } });
        } catch {
          continue;
        }
        await dedup.markSent(key);
        sent.push({ kind: "waitlist_seat_offer", to: app.email ?? String(app.userId) });
      }
    }
  }
  // Expire holds from previous ticks.
  await db
    .collection("applications")
    .updateMany({ waitlistHoldUntil: { $lte: now } }, { $unset: { waitlistHoldUntil: "" } })
    .catch(() => {});

  /* ---------- 7. Engagement nudges for stale learners + weekly digest ---------- */
  const progressRows = await db
    .collection("student_progress")
    .find({})
    .project({ userId: 1, enrollmentId: 1, updatedAt: 1, lastChapter: 1 })
    .limit(4000)
    .toArray();

  const stale = staleLearners(
    enrolled as Array<{ userId: string; email: string; name: string; subjects?: string[]; batch: string; updatedAt: Date }>,
    progressRows as Array<{ userId: string; enrollmentId: string; updatedAt: Date; lastChapter: string | null }>,
    now
  );
  for (const { student } of stale) {
    const key = `progress:${weekKey(now)}:${student.userId}`;
    if (await dedup.alreadySent(key)) continue;
    const copy = nudgeCopy(student);
    await notify(student.userId, { kind: "progress-nudge", title: "Keep your streak alive", message: copy, href: "/dashboard" });
    if (doEmail && student.email) {
      await import("@/lib/email").then(({ sendEmail }) =>
        sendEmail({
          to: student.email,
          subject: "Your Language Hub streak is waiting",
          text: copy,
          html: `<div style="font-family:Arial;line-height:1.6;color:#334155"><p>${copy.replace(/\n/g, "<br/>")}</p><p><a href="/dashboard" style="color:#6366f1">Open your dashboard</a></p></div>`,
        })
      );
    }
    await dedup.markSent(key);
    sent.push({ kind: "progress_nudge", to: student.email ?? student.userId });
  }

  // Weekly digest for all enrolled students.
  for (const e of enrolled as Array<{ userId: string; email?: string; name: string; subjects?: string[]; batch: string }>) {
    const key = `digest:${weekKey(now)}:${e.userId}`;
    if (await dedup.alreadySent(key)) continue;
    const copy = digestCopy(e);
    await notify(e.userId, { kind: "weekly-digest", title: "Your weekly check-in", message: copy, href: "/dashboard" });
    if (doEmail && e.email) {
      await import("@/lib/email").then(({ sendEmail }) =>
        sendEmail({
          to: e.email!,
          subject: "Language Hub · this week for you",
          text: copy,
          html: `<div style="font-family:Arial;line-height:1.6;color:#334155"><p>${copy.replace(/\n/g, "<br/>")}</p><p><a href="/dashboard" style="color:#6366f1">Open your dashboard</a></p></div>`,
        })
      );
    }
    await dedup.markSent(key);
    sent.push({ kind: "weekly_digest", to: e.email ?? e.userId });
  }

  /* ---------- 8. Auto-certificates: progress >= 80% with no certificate ---------- */
  const enrollmentById = new Map(
    enrolled.map((e) => [String(e._id), e])
  );
  for (const p of progressRows as Array<{ userId: string; enrollmentId: string; updatedAt: Date; chapters?: Array<{ completed: boolean }> }>) {
    const percent = completionPercent({ chapters: p.chapters ?? [] });
    if (!shouldIssueCertificate(percent)) continue;
    const enr = enrollmentById.get(p.enrollmentId) as
      | { _id?: unknown; userId: string; name: string; email: string; subjects?: string[]; batch: string }
      | undefined;
    if (!enr) continue;
    const existing = await db.collection("certificates").countDocuments({ enrollmentId: p.enrollmentId });
    if (existing > 0) continue;
    const key = `cert:${p.enrollmentId}`;
    if (await dedup.alreadySent(key)) continue;

    const certificateId = makeCertificateId();
    try {
      await db.collection("certificates").insertOne({
        userId: enr.userId,
        enrollmentId: p.enrollmentId,
        studentName: enr.name || "Student",
        course: enr.subjects?.[0] ?? "",
        batch: enr.batch,
        issuedAt: issueDate(),
        completionPercent: percent,
        signedBy: "Javeria Malik",
        certificateId,
        createdAt: now,
      });
      await notify(enr.userId, {
        kind: "certificate",
        title: "Your certificate is ready! 🎉",
        message: `${enr.name}, you completed ${percent}% of ${enr.subjects?.[0] ?? "your course"}. Claim your certificate from your dashboard.`,
        href: "/dashboard",
      });
    } catch {
      continue;
    }
    await dedup.markSent(key);
    sent.push({ kind: "auto_certificate", to: enr.email ?? enr.userId });
  }

  /* ---------- 9. AI operations agent: applications → enroll → payments ---------- */
  // The autonomous AI admin continues processing the business queues in the
  // background on every cron tick — even when no admin panel is open.
  let agent: { processed: number; ok: number; failed: number; held: number; disabled: boolean } = { processed: 0, ok: 0, failed: 0, held: 0, disabled: false };
  try {
    const round = await runAgentRound(14);
    agent = { processed: round.processed, ok: round.ok, failed: round.failed, held: round.held, disabled: round.disabled };
    if (round.skipped > 0 || round.held > 0 || round.processed > 0) {
      sent.push({ kind: "ai_agent_round", to: `processed=${round.processed}` });
    }
  } catch {
    // agent must never break the rest of the automation tick
  }

  return NextResponse.json({ ok: true, sent, count: sent.length, agent });
}