import { isStepCount, tool, ToolLoopAgent, zodSchema } from "ai";
import { z } from "zod";
import { aiConfigured, aiModelLabel, getChatModel } from "@/lib/ai/config";
import { collectWeeklyMetrics, type WeeklyMetrics } from "@/lib/ai/weekly";

/**
 * Natural-language admin query — "how much revenue did IELTS bring in May?"
 * The agent pulls real metrics through the same read-tools as the weekly
 * report and answers in plain text. Offline-safe keyword fallback included.
 */

const emptyInput = z.object({});

const NL_SYSTEM = `You are the Language Hub data assistant. Convert the admin's plain-English question into a short, factual answer using the tools. If the question compares courses or periods, show a small comparison. If no tool answers it, say so honestly based on what you can see. Write money in Pakistani Rupees (Rs). Keep it under 120 words.`;

export interface NlQueryResult {
  answer: string;
  metrics: WeeklyMetrics;
  offline: boolean;
  model: string | null;
}

/** Deterministic keyword fallback over collected metrics. */
export function offlineNlAnswer(query: string, m: WeeklyMetrics): string {
  const q = query.toLowerCase();
  const has = (...w: string[]) => w.some((x) => q.includes(x));
  const lines: string[] = [];

  if (has("revenue", "income", "earning", "money", "income")) {
    lines.push(
      `Paid revenue in the last ${m.period.days} days: Rs ${m.revenue.amount.toLocaleString("en-PK")} across ${m.revenue.transactions} transactions (withdrawals: Rs ${m.revenue.withdrawals.toLocaleString("en-PK")}).`
    );
  }
  if (has("enroll", "admission", "student", "course")) {
    lines.push(
      `Enrollments: ${m.enrollments.total} requested, ${m.enrollments.enrolled} confirmed, ${m.enrollments.awaitingPayment} awaiting payment.` +
        (m.enrollments.byCourse.length
          ? ` Top: ${m.enrollments.byCourse.map((c) => `${c.course} (${c.count})`).join(", ")}.`
          : "")
    );
  }
  if (has("application", "lead")) {
    lines.push(
      `Applications: ${m.applications.total} (${m.applications.approved} approved, ${m.applications.pending} pending, ${m.applications.rejected} rejected). Leads: ${m.leads.demoBookings} demo bookings, ${m.leads.whatsapp} WhatsApp, ${m.leads.placementTests} placement tests.`
    );
  }
  if (has("progress", "assignment", "engagement", "active")) {
    lines.push(
      `Engagement: ${m.progress.activeLearners} active learners (avg ${m.progress.avgCompletionPct}% completion), ${m.assignments.submitted} assignments submitted, ${m.certificates.issued} certificates.`
    );
  }
  if (has("signup", "new user", "registered")) {
    lines.push(`New signups: ${m.signups} in the last ${m.period.days} days.`);
  }
  if (lines.length === 0) {
    lines.push(
      `In the last ${m.period.days} days: ${m.signups} signups, ${m.applications.total} applications, ${m.enrollments.enrolled} enrolled, Rs ${m.revenue.amount.toLocaleString("en-PK")} revenue, ${m.leads.demoBookings + m.leads.whatsapp + m.leads.placementTests} leads.`
    );
  }
  return lines.join("\n");
}

export async function answerAdminQuery(query: string, days: number): Promise<NlQueryResult> {
  const m = await collectWeeklyMetrics(days);
  if (!aiConfigured()) {
    return { answer: offlineNlAnswer(query, m), metrics: m, offline: true, model: null };
  }

  try {
    let metricsMemo: WeeklyMetrics | null = null;
    const getMetrics = () => {
      if (!metricsMemo) metricsMemo = m;
      return metricsMemo;
    };
    const tools = {
      getRevenue: tool({
        description: "Paid revenue, transactions and withdrawals for the period.",
        inputSchema: zodSchema(emptyInput),
        execute: async () => getMetrics().revenue,
      }),
      getEnrollments: tool({
        description: "Enrollment counts by status and by course.",
        inputSchema: zodSchema(emptyInput),
        execute: async () => getMetrics().enrollments,
      }),
      getApplications: tool({
        description: "Application counts by status.",
        inputSchema: zodSchema(emptyInput),
        execute: async () => getMetrics().applications,
      }),
      getEngagement: tool({
        description: "Assignments, learner progress and certificates.",
        inputSchema: zodSchema(emptyInput),
        execute: async () => ({
          assignments: getMetrics().assignments,
          progress: getMetrics().progress,
          certificates: getMetrics().certificates,
        }),
      }),
      getLeads: tool({
        description: "Placement tests, demo bookings and WhatsApp leads.",
        inputSchema: zodSchema(emptyInput),
        execute: async () => getMetrics().leads,
      }),
      getSignups: tool({
        description: "New user signups for the period.",
        inputSchema: zodSchema(emptyInput),
        execute: async () => getMetrics().signups,
      }),
    };

    const agent = new ToolLoopAgent({
      model: getChatModel(),
      instructions: NL_SYSTEM,
      tools,
      stopWhen: isStepCount(8),
      temperature: 0.2,
    });
    const result = await agent.generate({
      prompt: `Window: the last ${days} days (today is ${new Date().toDateString()}).\nAdmin question: "${query}"`,
    });
    const answer = (result.text ?? "").trim();
    return {
      answer: answer || offlineNlAnswer(query, m),
      metrics: m,
      offline: false,
      model: aiModelLabel(),
    };
  } catch {
    return { answer: offlineNlAnswer(query, m), metrics: m, offline: true, model: null };
  }
}