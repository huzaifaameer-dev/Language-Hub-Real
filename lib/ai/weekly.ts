import { isStepCount, tool, ToolLoopAgent, zodSchema } from "ai";
import { z } from "zod";
import { aiConfigured, aiModelLabel, getChatModel } from "@/lib/ai/config";
import { WEEKLY_SYSTEM } from "@/lib/ai/prompts";
import { getAiReportsCollection, getDb } from "@/lib/db";

export interface WeeklyMetrics {
  period: { start: string; end: string; days: number };
  signups: number;
  applications: { total: number; pending: number; approved: number; rejected: number };
  enrollments: {
    total: number;
    enrolled: number;
    awaitingPayment: number;
    rejected: number;
    byCourse: Array<{ course: string; count: number }>;
  };
  revenue: { amount: number; transactions: number; withdrawals: number };
  leads: { placementTests: number; demoBookings: number; whatsapp: number };
  assignments: { submitted: number; graded: number };
  progress: { activeLearners: number; avgCompletionPct: number };
  certificates: { issued: number };
}

/** Deterministic data gathering for the weekly window (tools + storage share this). */
export async function collectWeeklyMetrics(days: number): Promise<WeeklyMetrics> {
  const db = await getDb();
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);

  const [users, apps, enrs, payments, placementLeads, demoBookings, waLeads, assignDocs, certs] =
    await Promise.all([
      db
        .collection("users")
        .find({ role: { $ne: "ADMIN" }, createdAt: { $gte: start } })
        .count(),
      db.collection("applications").find({ createdAt: { $gte: start } }).toArray(),
      db.collection("enrollments").find({ createdAt: { $gte: start } }).toArray(),
      db
        .collection("payments")
        .find({ status: "PAID", createdAt: { $gte: start } })
        .project({ amount: 1, type: 1 })
        .toArray(),
      db.collection("placement_test_leads").countDocuments({ createdAt: { $gte: start } }),
      db.collection("demo_bookings").countDocuments({ createdAt: { $gte: start } }),
      db.collection("whatsapp_leads").countDocuments({ createdAt: { $gte: start } }),
      db.collection("assignments").find({ createdAt: { $gte: start } }).toArray(),
      db.collection("certificates").countDocuments({ createdAt: { $gte: start } }),
    ]);

  const progressRows = await db
    .collection("student_progress")
    .find({ updatedAt: { $gte: start } })
    .project({ chapters: 1 })
    .toArray();

  const avgCompletion = (() => {
    if (progressRows.length === 0) return 0;
    const total = progressRows.reduce((sum, p) => {
      const list = (p.chapters as Array<{ completed: boolean }>) ?? [];
      if (list.length === 0) return sum;
      return sum + list.filter((c) => c.completed).length / list.length;
    }, 0);
    return Math.round((total / progressRows.length) * 100);
  })();

  const byCourse: Record<string, number> = {};
  for (const e of enrs) {
    const subjects = (e.subjects ?? []) as string[];
    for (const s of subjects) byCourse[s] = (byCourse[s] ?? 0) + 1;
  }
  const topCourses = Object.entries(byCourse)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([course, count]) => ({ course, count }));

  return {
    period: { start: start.toISOString(), end: end.toISOString(), days },
    signups: users,
    applications: {
      total: apps.length,
      pending: apps.filter((a) => a.status === "PENDING").length,
      approved: apps.filter((a) => a.status === "APPROVED").length,
      rejected: apps.filter((a) => a.status === "REJECTED").length,
    },
    enrollments: {
      total: enrs.length,
      enrolled: enrs.filter((e) => e.status === "ENROLLED").length,
      awaitingPayment: enrs.filter((e) => e.status === "AWAITING_PAYMENT" || e.status === "PROOF_SUBMITTED").length,
      rejected: enrs.filter((e) => e.status === "REJECTED").length,
      byCourse: topCourses,
    },
    revenue: {
      amount: payments.filter((p) => (p.type ?? "DEPOSIT") !== "WITHDRAWAL").reduce((s, p) => s + (p.amount ?? 0), 0),
      transactions: payments.filter((p) => (p.type ?? "DEPOSIT") !== "WITHDRAWAL").length,
      withdrawals: payments.filter((p) => (p.type ?? "DEPOSIT") === "WITHDRAWAL").reduce((s, p) => s + (p.amount ?? 0), 0),
    },
    leads: { placementTests: placementLeads, demoBookings: demoBookings, whatsapp: waLeads },
    assignments: {
      submitted: assignDocs.filter((a) => a.status !== "DRAFT").length,
      graded: assignDocs.filter((a) => a.status === "GRADED").length,
    },
    progress: { activeLearners: progressRows.length, avgCompletionPct: avgCompletion },
    certificates: { issued: certs },
  };
}

/** Deterministic narrative used when no AI key is configured (or the agent yields nothing). */
export function offlineWeeklyText(m: WeeklyMetrics): string {
  const { start, end, days } = m.period;
  return `### Weekly performance · last ${days} days (${new Date(start).toLocaleDateString("en-GB")} – ${new Date(end).toLocaleDateString("en-GB")})

**Headline:** ${m.signups} new student${m.signups === 1 ? "" : "s"}, ${m.enrollments.enrolled} enrolled, Rs. ${m.revenue.amount.toLocaleString("en-PK")} in paid revenue.

**Highlights**
- Applications: ${m.applications.total} received (${m.applications.approved} approved, ${m.applications.pending} pending).
- Enrollments: ${m.enrollments.total} requested, ${m.enrollments.enrolled} confirmed, ${m.enrollments.awaitingPayment} awaiting payment.
- Leads: ${m.leads.placementTests} placement tests, ${m.leads.demoBookings} demo bookings, ${m.leads.whatsapp} WhatsApp conversations.
- Engagement: ${m.progress.activeLearners} active learners (avg ${m.progress.avgCompletionPct}% course completion), ${m.assignments.submitted} assignments submitted, ${m.certificates.issued} certificates issued.

${m.enrollments.byCourse.length ? `**Top courses:** ${m.enrollments.byCourse.map((c) => `${c.course} (${c.count})`).join(" · ")}` : "**Top courses:** (none this week)"}

**Needs attention:** ${m.enrollments.awaitingPayment} students have not completed payment — follow up via WhatsApp. ${m.applications.pending} applications are still pending review.

**Recommendations**
1. Follow up on pending applications and awaiting-payment students within 24h.
2. Convert ${m.leads.demoBookings} demo leads into enrollments with a personal call.
3. Encourage active learners with incomplete courses to re-book weekly mocks.

> ⚠️ Offline mode: add \`AI_API_KEY\` to get a richer, insight-driven report from the AI agent.`;
}

/** The five tools the weekly agent may call. Cached per call so repeated
 * invocations don't re-hit Mongo. */
const emptyInput = z.object({});

async function agentRun(
  days: number,
  m: WeeklyMetrics,
  configured: boolean
): Promise<{ text: string; toolCallsUsed: number }> {
  if (!configured) return { text: offlineWeeklyText(m), toolCallsUsed: 0 };

  let metricsMemo: WeeklyMetrics | null = null;
  const getMetrics = () => {
    if (!metricsMemo) metricsMemo = m;
    return metricsMemo;
  };

  const tools = {
    getCoreMetrics: tool({
      description: "Applications, enrollments, leads and user signups for the period.",
      inputSchema: zodSchema(emptyInput),
      execute: async () => {
        const d = await getMetrics();
        return {
          signups: d.signups,
          applications: d.applications,
          enrollments: { total: d.enrollments.total, enrolled: d.enrollments.enrolled, awaitingPayment: d.enrollments.awaitingPayment },
          leads: d.leads,
        };
      },
    }),
    getRevenueMetrics: tool({
      description: "Paid revenue and transactions within the period.",
      inputSchema: zodSchema(emptyInput),
      execute: async () => {
        const d = await getMetrics();
        return d.revenue;
      },
    }),
    getStudentEngagement: tool({
      description: "Assignment submissions, learner activity/completion and certificates.",
      inputSchema: zodSchema(emptyInput),
      execute: async () => {
        const d = await getMetrics();
        return { assignments: d.assignments, progress: d.progress, certificates: d.certificates };
      },
    }),
    getCoursePopularity: tool({
      description: "Which courses attracted the most enrollments this period.",
      inputSchema: zodSchema(emptyInput),
      execute: async () => {
        const d = await getMetrics();
        return { byCourse: d.enrollments.byCourse };
      },
    }),
  };

  try {
    const agent = new ToolLoopAgent({
      model: getChatModel(),
      instructions: WEEKLY_SYSTEM,
      tools,
      stopWhen: isStepCount(8),
      temperature: 0.4,
    });
    const result = await agent.generate({
      prompt: `Today is ${new Date().toDateString()}. Generate the weekly performance summary for the last ${days} days. Call the tools to collect real data before writing.`,
    });
    const text = (result.text ?? "").trim();
    const toolCallsUsed = result.toolResults?.length ?? 0;
    return { text: text || offlineWeeklyText(m), toolCallsUsed };
  } catch {
    return { text: offlineWeeklyText(m), toolCallsUsed: 0 };
  }
}

export interface WeeklyReport {
  id: string;
  period: string;
  text: string;
  metrics: WeeklyMetrics;
  offline: boolean;
  model: string | null;
  requestedBy: string;
  createdAt: string;
}

/**
 * Run the weekly teacher-assistant agent: gather real metrics, let the model
 * pull data through function calls, write the narrative, and persist a report.
 */
export async function runWeeklySummary(days: number, adminEmail: string): Promise<WeeklyReport> {
  const m = await collectWeeklyMetrics(days);
  const configured = aiConfigured();
  const { text, toolCallsUsed } = await agentRun(days, m, configured);

  const periodLabel = `last ${days} days · ${new Date(m.period.start).toLocaleDateString("en-GB")} – ${new Date(m.period.end).toLocaleDateString("en-GB")}`;
  const createdAt = new Date();

  const col = await getAiReportsCollection();
  const res = await col.insertOne({
    kind: "weekly",
    period: periodLabel,
    periodStart: new Date(m.period.start),
    periodEnd: new Date(m.period.end),
    text,
    metrics: m as unknown as Record<string, unknown>,
    model: configured ? aiModelLabel() : null,
    offline: !configured || toolCallsUsed === 0,
    requestedBy: adminEmail,
    toolCallsUsed,
    createdAt,
  });

  return {
    id: String(res.insertedId),
    period: periodLabel,
    text,
    metrics: m,
    offline: !configured || toolCallsUsed === 0,
    model: configured ? aiModelLabel() : null,
    requestedBy: adminEmail,
    createdAt: createdAt.toISOString(),
  };
}

export interface WeeklyReportLite {
  id: string;
  period: string;
  headline: string;
  offline: boolean;
  createdAt: string;
}

export async function listWeeklyReports(limit = 10): Promise<WeeklyReportLite[]> {
  const db = await getDb();
  const rows = await db
    .collection("ai_reports")
    .find({ kind: "weekly" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return rows.map((r) => ({
    id: String(r._id),
    period: r.period ?? "",
    headline: (r.text ?? "").split("\n").find((l: string) => l.trim().startsWith("#"))?.replace(/^#+\s*/, "") ?? "Weekly report",
    offline: !!r.offline,
    createdAt: r.createdAt.toISOString(),
  }));
}