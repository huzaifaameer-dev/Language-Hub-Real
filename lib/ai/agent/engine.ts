import { generateText } from "ai";
import { ObjectId } from "mongodb";
import { getDb, getAiAgentJobsCollection, getAiAgentLogCollection } from "@/lib/db";
import { aiConfigured, aiModelLabel, getChatModel } from "@/lib/ai/config";
import {
  decideApplication,
  decideEnrollment,
  feeForCourse,
  REVIEW_FLAG,
  EMAIL_OK,
} from "@/lib/ai/agent/rules";
import { notify, notifyAdmins } from "@/lib/notifications";

/** In-app notification helper used by the agent for user-facing updates. */
async function notifyUser(
  userId: string,
  title: string,
  body: string,
  name?: string,
  href = "/dashboard"
) {
  if (!userId) return;
  try {
    const display = name ? ` ${name.split(" ")[0]}` : "";
    await notify(userId, { kind: "application", title, message: `${body}${display ? ` (${display})` : ""}`, href });
  } catch {
    // best-effort
  }
}
import {
  approveApplication,
  rejectApplication,
  requestEnrollmentPayment,
  confirmEnrollment,
  rejectEnrollment,
  recordWithdrawal,
  publishBlog
} from "@/lib/ai/agent/tools";
import { writeAiBlog } from "@/lib/ai/agent/blog";
import { weekKey } from "@/lib/growth/streaks";
import { FALLBACK_COURSES } from "@/lib/course-data";

/**
 * Autonomous operations agent. Discovers work in the business queues
 * (applications, enrollment requests, payment proofs, weekly blog), decides
 * what to do through deterministic rules (optionally re-worded by the LLM),
 * executes the audited tools, and records everything to ai_agent_log. Runs
 * from the cron endpoint so it processes the backlog even when no admin panel
 * tab is open.
 */

export const AGENT = "AI Agent";

async function personalizeMessage(
  kind: "application" | "enrollment",
  action: "APPROVE" | "REJECT" | "REQUEST_PAYMENT",
  name: string,
  context: string
): Promise<string> {
  if (!aiConfigured()) return "";
  try {
    const { text } = await generateText({
      model: getChatModel(),
      system:
        "You are the admissions assistant at Language Hub. Write ONE warm, short message (2-3 sentences, plain text, no markdown) that will be shown to a applicant. It must match the decision and be honest. Do not invent facts.",
      prompt: `Decision: ${action}. Applicant: ${name}. Context: ${context.slice(0, 500)}`,
      temperature: 0.4,
      maxOutputTokens: 160,
    });
    return text.trim().slice(0, 500);
  } catch {
    return "";
  }
}

export interface AgentRoundResult {
  processed: number;
  ok: number;
  skipped: number;
  failed: number;
  held: number;
  offline: boolean;
  disabled: boolean;
  model: string | null;
  ms: number;
  items: Array<{ refKey: string; action: string; ok: boolean; message?: string }>;
}

/** Discover + queue one work unit per source record, deduped by refKey. */
async function enqueueJobs(limit: number): Promise<{ upserts: number }> {
  const db = await getDb();
  const jobs = await getAiAgentJobsCollection();
  const now = new Date();
  let upserts = 0;

  const pendingApps = await db
    .collection("applications")
    .find({ status: "PENDING", agentProcessedAt: { $exists: false } })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();
  for (const a of pendingApps) {
    const refKey = `app:${String(a._id)}`;
    try {
      await jobs.insertOne({
        kind: "APPLICATION",
        refKey,
        refId: String(a._id),
        status: "queued",
        decision: null,
        createdAt: now,
        updatedAt: now,
      });
      upserts += 1;
    } catch {
      // unique refKey already exists — skip
    }
  }

  const pendingEnrs = await db
    .collection("enrollments")
    .find({
      $or: [
        { status: "PENDING", agentProcessedAt: { $exists: false } },
        { status: "PROOF_SUBMITTED", proofProcessedAt: { $exists: false } },
      ],
    })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();
  for (const e of pendingEnrs) {
    const isProof = e.status === "PROOF_SUBMITTED";
    const refKey = isProof ? `enr:${String(e._id)}:proof` : `enr:${String(e._id)}`;
    try {
      await jobs.insertOne({
        kind: "ENROLLMENT",
        refKey,
        refId: String(e._id),
        status: "queued",
        decision: null,
        createdAt: now,
        updatedAt: now,
      });
      upserts += 1;
    } catch {
      // already queued
    }
  }

  // Demo bookings awaiting an admin decision.
  const pendingDemos = await db
    .collection("demo_bookings")
    .find({ status: "PENDING", agentProcessedAt: { $exists: false } })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();
  for (const d of pendingDemos) {
    const refKey = `demo:${String(d._id)}`;
    try {
      await jobs.insertOne({
        kind: "DEMO",
        refKey,
        refId: String(d._id),
        status: "queued",
        decision: null,
        createdAt: now,
        updatedAt: now,
      });
      upserts += 1;
    } catch {
      // already queued / processed
    }
  }

  return { upserts };
}

export async function runAgentRound(limit = 10, dryRun = false): Promise<AgentRoundResult> {
  const started = Date.now();
  // Always-on by default — the agent operates autonomously. Set
  // AI_AGENT_ENABLED=0 only to pause it explicitly.
  const disabled = process.env.AI_AGENT_ENABLED === "0";
  if (disabled) {
    return {
      processed: 0,
      ok: 0,
      skipped: 0,
      failed: 0,
      held: 0,
      offline: !aiConfigured(),
      disabled: true,
      model: null,
      ms: 0,
      items: [],
    };
  }
  const db = await getDb();
  const jobs = await getAiAgentJobsCollection();
  const logCol = await getAiAgentLogCollection();
  const configured = aiConfigured();
  const model = configured ? aiModelLabel() : null;
  const courses = await db.collection("courses").find({ active: true }).limit(20).toArray();
  const catalog: Array<{ name: string; fee?: number }> = courses.length
    ? (courses as unknown as Array<{ name: string; fee?: number }>)
    : (FALLBACK_COURSES as unknown as Array<{ name: string; fee?: number }>);

  await enqueueJobs(limit);

  const queued = await jobs.find({ status: "queued" }).sort({ createdAt: 1 }).limit(limit).toArray();
  const items: AgentRoundResult["items"] = [];
  let ok = 0;
  let skipped = 0;
  let failed = 0;
  let held = 0;

  for (const job of queued) {
    if (dryRun) {
      await jobs.updateOne({ _id: job._id }, { $set: { status: "skipped", updatedAt: new Date() } });
      skipped += 1;
      continue;
    }
    await jobs.updateOne({ _id: job._id }, { $set: { status: "running", updatedAt: new Date() } });
    let action = "SKIPPED";
    let result: { ok: boolean; message: string; skipped?: boolean } | null = null;

    try {
      if (job.kind === "APPLICATION" && job.refId) {
        const app = await db.collection("applications").findOne({ _id: new ObjectId(job.refId) });
        if (app) {
          const decision = decideApplication(
            {
              userId: String(app.userId),
              name: app.name ?? "",
              email: app.email ?? "",
              place: app.place ?? "",
              bio: app.bio ?? "",
              message: app.message ?? "",
              course: app.course ?? "",
              createdAt: app.createdAt,
            }
          );
          if (decision.action === "CLARIFY") {
            action = "CLARIFY (ask for goal)";
            await db.collection("applications").updateOne(
              { _id: app._id },
              { $set: { ...REVIEW_FLAG, agentReason: decision.reason, agentProcessedAt: new Date() } }
            );
            await notifyUser(app.userId, "Clarification needed", decision.message, app.name);
            result = { ok: true, message: "Clarification message sent to applicant." };
            held += 1;
          } else {
            const words = await personalizeMessage("application", decision.action as "APPROVE" | "REJECT", app.name ?? "", decision.reason);
            result =
              decision.action === "APPROVE"
                ? await approveApplication(job.refId, words || decision.message)
                : await rejectApplication(job.refId, words || decision.message);
            action = decision.action;
            await db.collection("applications").updateOne(
              { _id: app._id },
              { $set: { agentProcessedAt: new Date() } }
            );
          }
        } else {
          result = { ok: false, message: "application not found" };
        }
      } else if (job.kind === "ENROLLMENT" && job.refId) {
        const e = await db.collection("enrollments").findOne({ _id: new ObjectId(job.refId) });
        if (e) {
          const fee = feeForCourse((e.subjects ?? [])[0] ?? "", catalog);
          const decision = decideEnrollment(
            {
              userId: String(e.userId),
              email: e.email ?? "",
              name: e.name ?? "",
              subjects: e.subjects ?? [],
              batch: e.batch ?? "",
              status: e.status,
              paymentProof: e.paymentProof ?? null,
              paymentMethod: e.paymentMethod ?? null,
              createdAt: e.createdAt,
            },
            fee
          );
          if (decision.action === "CONFIRM") {
            action = "CONFIRM (proof)";
            result = await confirmEnrollment(job.refId, { message: decision.message, amount: fee, note: "AI agent: payment proof verified", method: e.paymentMethod ?? "easypaisa" });
          } else if (decision.action === "REQUEST_PAYMENT") {
            action = "REQUEST_PAYMENT";
            result = await requestEnrollmentPayment(job.refId, { message: decision.message, paymentInstructions: decision.paymentInstructions });
          } else {
            action = "REJECT";
            const words = await personalizeMessage("enrollment", "REJECT", e.name ?? "", decision.reason);
            result = await rejectEnrollment(job.refId, words || decision.message);
          }
          await db.collection("enrollments").updateOne(
            { _id: e._id },
            {
              $set: {
                ...(e.status === "PROOF_SUBMITTED"
                  ? { proofProcessedAt: new Date() }
                  : { agentProcessedAt: new Date() }),
              },
            }
          );
        } else {
          result = { ok: false, message: "enrollment not found" };
        }
      } else if (job.kind === "DEMO" && job.refId) {
        // AI decides demo bookings: confirm (valid contact + course) or decline.
        const demo = await db.collection("demo_bookings").findOne({ _id: new ObjectId(job.refId) });
        if (demo) {
          const phone = String(demo.phone ?? "");
          const email = String(demo.email ?? "");
          const hasContact = phone.replace(/[^\d]/g, "").length >= 7 || EMAIL_OK.test(email);
          if (hasContact) {
            action = "CONFIRM (demo)";
            await db.collection("demo_bookings").updateOne(
              { _id: demo._id },
              { $set: { status: "CONFIRMED", updatedAt: new Date(), agentProcessedAt: new Date() } }
            );
            const { sendDemoBookingDecisionEmail } = await import("@/lib/email");
            if (email) void sendDemoBookingDecisionEmail({ to: email, name: demo.name, confirmed: true, course: demo.course, preferredDate: demo.preferredDate, preferredTime: demo.preferredTime }).catch(() => {});
            const { sendWaText, waConfigured } = await import("@/lib/whatsapp");
            if (waConfigured() && phone) {
              void sendWaText({ to: phone, text: `Salam ${String(demo.name ?? "").split(" ")[0]}! Your ${demo.course} demo is confirmed for ${demo.preferredDate} at ${demo.preferredTime}. We'll share the meeting link shortly. — Language Hub` }).catch(() => {});
            }
            result = { ok: true, message: "Demo confirmed + notified." };
          } else {
            action = "REJECT (demo)";
            await db.collection("demo_bookings").updateOne(
              { _id: demo._id },
              { $set: { status: "REJECTED", adminMessage: "No valid contact to confirm the demo.", updatedAt: new Date(), agentProcessedAt: new Date() } }
            );
            result = { ok: true, message: "Demo declined — no reachable contact." };
          }
        } else {
          result = { ok: false, message: "demo booking not found" };
        }
      } else {
        result = { ok: true, skipped: true, message: "no handler" };
      }
    } catch (err) {
      result = { ok: false, message: (err as Error).message };
    }

    if (!result) result = { ok: false, message: "no result" };

    await jobs.updateOne(
      { _id: job._id },
      {
        $set: {
          status: result.skipped ? "skipped" : result.ok ? "done" : "failed",
          decision: { action, reason: (job.decision?.reason as string) ?? "" },
          processedAt: new Date(),
          error: result.ok ? null : result.message,
          updatedAt: new Date(),
        },
      }
    );
    await logCol.insertOne({
      jobId: String(job._id),
      kind: job.kind,
      action,
      refKey: job.refKey,
      detail: result.message,
      offline: !configured,
      model,
      ok: result.ok,
      createdAt: new Date(),
    });

    if (result.skipped) skipped += 1;
    else if (result.ok) ok += 1;
    else failed += 1;
    items.push({ refKey: job.refKey, action, ok: result.ok, message: result.message });
  }

  return {
    processed: items.length,
    ok,
    skipped,
    failed,
    held,
    offline: !configured,
    disabled: false,
    model,
    ms: Date.now() - started,
    items,
  };
}

/** Optional weekly auto-blog from a rotating course topic (AI_AGENT_BLOG=1). */
export async function runWeeklyBlog(forcedDryRun = false): Promise<AgentResult | null> {
  if (process.env.AI_AGENT_BLOG !== "1") return null;
  const jobs = await getAiAgentJobsCollection();
  const key = `blog:${weekKey()}`;
  const exists = await jobs.findOne({ refKey: key, kind: "BLOG" });
  if (exists) return null;
  const now = new Date();
  try {
    await jobs.insertOne({ kind: "BLOG", refKey: key, status: "queued", decision: null, createdAt: now, updatedAt: now });
  } catch {
    return null;
  }
  if (forcedDryRun) return null;
  const topic = `${FALLBACK_COURSES[Math.abs(hashOf(weekKey())) % FALLBACK_COURSES.length].name} learning guide`;
  const { post } = await writeAiBlog({ topic });
  const result = await publishBlog({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    tags: post.tags,
    author: "Aina (AI)",
  });
  await jobs.updateOne({ refKey: key }, { $set: { status: result.ok ? "done" : "failed", processedAt: new Date(), error: result.ok ? null : result.message, updatedAt: new Date() } });
  return result;
}

export interface AgentStatus {
  mode: string;
  aiConfigured: boolean;
  model: string | null;
  jobs: { queued: number; done: number; failed: number };
  lastLogs: Array<{ kind: string; action: string; refKey: string; ok: boolean; createdAt: string }>;
}

export async function getAgentStatus(): Promise<AgentStatus> {
  const jobs = await getAiAgentJobsCollection();
  const logCol = await getAiAgentLogCollection();
  const [queued, done, failed, recent] = await Promise.all([
    jobs.countDocuments({ status: "queued" }),
    jobs.countDocuments({ status: "done" }),
    jobs.countDocuments({ status: "failed" }),
    logCol.find({}).sort({ createdAt: -1 }).limit(20).toArray(),
  ]);
  return {
    mode: process.env.AI_AGENT_ENABLED === "0"
      ? "paused"
      : "auto",
    aiConfigured: aiConfigured(),
    model: aiConfigured() ? aiModelLabel() : null,
    jobs: { queued, done, failed },
    lastLogs: recent.map((l) => ({
      kind: l.kind,
      action: l.action,
      refKey: l.refKey,
      ok: l.ok,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}

export type AgentResult = { ok: boolean; ref?: string; message: string };

export interface InstantResult {
  ok: boolean;
  action: string;
  message: string;
  skipped?: boolean;
}

/**
 * Process ONE application immediately (event-triggered path). Called from the
 * application-submit route so the applicant gets a decision + message right
 * away instead of waiting for the next background tick. Atomic via the unique
 * job refKey.
 */
export async function processApplicationNow(applicationId: string): Promise<InstantResult> {
  const db = await getDb();
  const jobs = await getAiAgentJobsCollection();
  const logCol = await getAiAgentLogCollection();
  const now = new Date();
  const refKey = `app:${applicationId}`;
  try {
    await jobs.insertOne({ kind: "APPLICATION", refKey, refId: applicationId, status: "running", decision: null, createdAt: now, updatedAt: now });
  } catch {
    return { ok: true, action: "SKIPPED", message: "Already processed.", skipped: true };
  }

  const app = await db.collection("applications").findOne({ _id: new ObjectId(applicationId) });
  if (!app) {
    await jobs.updateOne({ refKey }, { $set: { status: "failed", error: "application not found", updatedAt: now } });
    return { ok: false, action: "FAILED", message: "Application not found." };
  }

  // Owner toggle: AI_AGENT_AUTO=0 switches the agent to "flag for review" —
  // it never approves/rejects on its own, just queues the item for a human.
  if (process.env.AI_AGENT_AUTO === "0") {
    await db.collection("applications").updateOne(
      { _id: app._id },
      { $set: { ...REVIEW_FLAG, agentReason: "Auto-decisions disabled (AI_AGENT_AUTO=0).", agentProcessedAt: now } }
    );
    await notifyAdmins({
      kind: "application-review",
      title: "New application — review",
      message: `${app.name ?? "Student"} · ${app.course ?? ""}`,
      href: "/admin-panel",
    });
    await jobs.updateOne({ refKey }, { $set: { status: "done", decision: { action: "REVIEW", reason: REVIEW_FLAG.agentNote }, processedAt: now, updatedAt: now } });
    await logCol.insertOne({ jobId: null, kind: "APPLICATION", action: "REVIEW (auto off)", refKey, detail: "Flagged for human review.", offline: !aiConfigured(), model: null, ok: true, createdAt: now });
    return { ok: true, action: "REVIEW", message: "Application flagged for review (auto-decision off)." };
  }

  const decision = decideApplication({
    userId: String(app.userId),
    name: app.name ?? "",
    email: app.email ?? "",
    place: app.place ?? "",
    bio: app.bio ?? "",
    message: app.message ?? "",
    course: app.course ?? "",
    createdAt: app.createdAt,
  });

  let action = decision.action;
  let result: { ok: boolean; message: string };

  if (decision.action === "CLARIFY") {
    await db.collection("applications").updateOne(
      { _id: app._id },
      { $set: { ...REVIEW_FLAG, agentReason: decision.reason, agentProcessedAt: now } }
    );
    await notifyUser(String(app.userId), "Clarification needed", decision.message, app.name);
    const { sendDecisionEmail } = await import("@/lib/email");
    if (app.email) {
      void sendDecisionEmail({
        to: app.email,
        name: app.name,
        kind: "application",
        approved: false,
        subject: "Action needed: complete your application",
        message: decision.message,
        href: "/dashboard",
      }).catch(() => {});
    }
    result = { ok: true, message: decision.message };
  } else {
    const words = await personalizeMessage("application", decision.action as "APPROVE" | "REJECT", app.name ?? "", decision.reason);
    result =
      decision.action === "APPROVE"
        ? await approveApplication(applicationId, words || decision.message)
        : await rejectApplication(applicationId, words || decision.message);
    action = decision.action;
    await db.collection("applications").updateOne({ _id: app._id }, { $set: { agentProcessedAt: now } });
  }

  await jobs.updateOne(
    { refKey },
    { $set: { status: result.ok ? "done" : "failed", decision: { action, reason: decision.reason }, processedAt: now, error: result.ok ? null : result.message, updatedAt: now } }
  );
  await logCol.insertOne({ jobId: null, kind: "APPLICATION", action, refKey, detail: result.message, offline: !aiConfigured(), model: aiConfigured() ? aiModelLabel() : null, ok: result.ok, createdAt: now });

  return { ok: result.ok, action, message: result.message };
}

/**
 * Process ONE enrollment immediately (event-triggered path): payment request on
 * create, or confirm+deposit on proof upload.
 */
export async function processEnrollmentNow(enrollmentId: string): Promise<InstantResult> {
  const db = await getDb();
  const jobs = await getAiAgentJobsCollection();
  const logCol = await getAiAgentLogCollection();
  const now = new Date();

  const e = await db.collection("enrollments").findOne({ _id: new ObjectId(enrollmentId) });
  if (!e) return { ok: false, action: "FAILED", message: "Enrollment not found." };
  const isProof = e.status === "PROOF_SUBMITTED";
  const refKey = isProof ? `enr:${enrollmentId}:proof` : `enr:${enrollmentId}`;
  try {
    await jobs.insertOne({ kind: "ENROLLMENT", refKey, refId: enrollmentId, status: "running", decision: null, createdAt: now, updatedAt: now });
  } catch {
    return { ok: true, action: "SKIPPED", message: "Already processed.", skipped: true };
  }

  // Owner toggle: review mode never auto-confirms/pays — flags for a human.
  if (process.env.AI_AGENT_AUTO === "0") {
    await db.collection("enrollments").updateOne(
      { _id: e._id },
      { $set: { ...REVIEW_FLAG, agentReason: "Auto-decisions disabled (AI_AGENT_AUTO=0).", ...(isProof ? { proofProcessedAt: now } : { agentProcessedAt: now }) } }
    );
    await notifyAdmins({
      kind: "enrollment-review",
      title: "Enrollment needs review",
      message: `${e.name ?? "Student"} · ${(e.subjects ?? [])[0] ?? ""} ${isProof ? "(proof uploaded)" : ""}`,
      href: "/admin-panel",
    });
    await jobs.updateOne({ refKey }, { $set: { status: "done", decision: { action: "REVIEW", reason: REVIEW_FLAG.agentNote }, processedAt: now, updatedAt: now } });
    await logCol.insertOne({ jobId: null, kind: "ENROLLMENT", action: "REVIEW (auto off)", refKey, detail: "Flagged for human review.", offline: !aiConfigured(), model: null, ok: true, createdAt: now });
    return { ok: true, action: "REVIEW", message: "Flagged for human review (auto-decision off)." };
  }

  const courses = await db.collection("courses").find({ active: true }).limit(20).toArray();
  const catalog: Array<{ name: string; fee?: number }> = courses.length
    ? (courses as unknown as Array<{ name: string; fee?: number }>)
    : (FALLBACK_COURSES as unknown as Array<{ name: string; fee?: number }>);
  const fee = feeForCourse((e.subjects ?? [])[0] ?? "", catalog);

  const decision = decideEnrollment(
    {
      userId: String(e.userId),
      email: e.email ?? "",
      name: e.name ?? "",
      subjects: e.subjects ?? [],
      batch: e.batch ?? "",
      status: e.status,
      paymentProof: e.paymentProof ?? null,
      paymentMethod: e.paymentMethod ?? null,
      createdAt: e.createdAt,
    },
    fee
  );

  let action: string;
  let result: { ok: boolean; message: string };

  if (decision.action === "CONFIRM") {
    action = "CONFIRM (proof)";
    result = await confirmEnrollment(enrollmentId, { message: decision.message, amount: fee, note: "AI agent: payment proof verified", method: e.paymentMethod ?? "easypaisa" });
  } else if (decision.action === "REQUEST_PAYMENT") {
    action = "REQUEST_PAYMENT";
    result = await requestEnrollmentPayment(enrollmentId, { message: decision.message, paymentInstructions: decision.paymentInstructions });
  } else {
    action = "REJECT";
    const words = await personalizeMessage("enrollment", "REJECT", e.name ?? "", decision.reason);
    result = await rejectEnrollment(enrollmentId, words || decision.message);
  }

  await db.collection("enrollments").updateOne(
    { _id: e._id },
    { $set: { ...(isProof ? { proofProcessedAt: now } : { agentProcessedAt: now }) } }
  );
  await jobs.updateOne(
    { refKey },
    { $set: { status: result.ok ? "done" : "failed", decision: { action, reason: decision.reason }, processedAt: now, error: result.ok ? null : result.message, updatedAt: now } }
  );
  await logCol.insertOne({ jobId: null, kind: "ENROLLMENT", action, refKey, detail: result.message, offline: !aiConfigured(), model: aiConfigured() ? aiModelLabel() : null, ok: result.ok, createdAt: now });

  return { ok: result.ok, action, message: result.message };
}

/** Execute an admin-instructed withdrawal through the agent (audited, overdraft-guarded). */
export async function runManualWithdrawal(input: {
  amount: number;
  method: string;
  note?: string;
}): Promise<AgentResult> {
  const logCol = await getAiAgentLogCollection();
  const amount = Math.round(Number(input.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "A valid positive amount is required." };
  }
  const result = await recordWithdrawal({
    amount,
    method: ["card", "easypaisa", "jazzcash", "bank", "cash"].includes(input.method) ? input.method : "cash",
    note: input.note,
  });
  await logCol.insertOne({
    jobId: null,
    kind: "WITHDRAWAL",
    action: "LEDGER_WITHDRAWAL",
    refKey: "manual",
    detail: result.message,
    offline: !aiConfigured(),
    model: aiConfigured() ? aiModelLabel() : null,
    ok: result.ok,
    createdAt: new Date(),
  });
  return result;
}

function hashOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}