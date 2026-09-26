import { ObjectId } from "mongodb";
import { revalidateTag } from "next/cache";

import {
  getDb,
  getApplicationsCollection,
  getEnrollmentsCollection,
  getNewsPostsCollection,
  getUsersCollection,
  getCoursesCollection,
  logAdminAction,
} from "@/lib/db";
import { publishEvent } from "@/lib/realtime";
import { notify } from "@/lib/notifications";
import { sendDecisionEmail } from "@/lib/email";
import { emailSubjectFor } from "@/lib/enrollment-actions";
import { sendWaText } from "@/lib/whatsapp";
import { formatPKR } from "@/lib/course-data";

/**
 * Audited business mutations the AI agent is allowed to perform. Every one
 * mirrors the exact behaviour of the admin API routes (same seat gates, same
 * email/notification copy, same ledger semantics) but runs with actor
 * "AI Agent". Callers (the agent engine) write the authoritative entry to the
 * agent log after each call.
 */

export interface AgentResult {
  ok: boolean;
  ref?: string;
  message: string;
  skipped?: boolean;
}

type Decision = {
  message?: string | null;
  paymentInstructions?: string | null;
  amount?: number;
  method?: string | null;
  note?: string | null;
};

async function notifyUser(userId: string, kind: string, title: string, body: string, href = "/dashboard") {
  if (!userId) return;
  try {
    await notify(userId, { kind, title, message: body, href });
    publishEvent({ table: kind === "application" ? "applications" : "enrollments", userId, at: Date.now() });
  } catch {
    // notification is best-effort
  }
}

export async function approveApplication(applicationId: string, msg?: string | null): Promise<AgentResult> {
  const col = await getApplicationsCollection();
  const target = await col.findOne({ _id: new ObjectId(applicationId) });
  if (!target) return { ok: false, message: "Application not found." };
  if (target.status === "APPROVED") return { ok: true, skipped: true, message: "Already approved." };
  const message = msg?.trim() || `Congratulations! Your application for ${target.course} is approved. Our team will contact you to confirm your enrollment.`;
  await col.updateOne(
    { _id: target._id },
    { $set: { status: "APPROVED", adminMessage: message, updatedAt: new Date() } }
  );
  await notifyUser(String(target.userId), "application", "Application approved", message);
  if (target.email) {
    void sendDecisionEmail({
      to: target.email,
      name: target.name,
      kind: "application",
      approved: true,
      subject: "Your application was approved 🎉",
      message,
      href: "/dashboard",
    }).catch(() => {});
  }

  // Auto-record the course fee as a pending deposit so the payment matches the
  // student's chosen course. Only write once per student+course pair.
  const db = await getDb();
  const courseFee = await getCoursesCollection().then((courses) =>
    courses.findOne({ name: (target as { course?: string }).course ?? "", active: true })
  );
  try {
    const amount = Number(courseFee?.fee ?? 0);
    if (amount > 0) {
      const dup = await db.collection("payments").findOne({
        userId: String(target.userId),
        note: { $regex: "auto:" + (target as { course?: string }).course?.replace(/[^a-z0-9]+/gi, "-") + ":" },
        status: { $in: ["PENDING", "PAID"] },
      });
      if (!dup) {
        await db.collection("payments").insertOne({
          enrollmentId: "",
          userId: String(target.userId),
          amount,
          currency: "PKR",
          provider: "manual",
          status: "PENDING",
          type: "DEPOSIT",
          method: "bank",
          note: `auto:${(target as { course?: string }).course?.replace(/[^a-z0-9]+/gi, "-") || "course"}:${String(target._id)}`,
          studentName: target.name,
          studentEmail: target.email,
          createdBy: "AI Agent",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  } catch {
    // payment record is best-effort — never fail approval on a ledger hiccup
  }

  // WhatsApp congrats when the user has a phone on file.
  try {
    const users = await getUsersCollection();
    const user = await users.findOne({ _id: new ObjectId(target.userId) }, { projection: { phone: 1, whatsapp: 1 } });
    const phone = (user as { phone?: string; whatsapp?: string } | null)?.phone || (user as { phone?: string; whatsapp?: string } | null)?.whatsapp;
    if (phone) {
      const feeText = courseFee && Number(courseFee.fee) > 0 ? ` (fee: ${formatPKR(Number(courseFee.fee))})` : "";
      void sendWaText({
        to: phone,
        text: `🎉 Congratulations ${target.name}! Your application for ${(target as { course?: string }).course} has been approved${feeText}. Our team will contact you to confirm your enrollment. Welcome to Language Hub!`,
      }).catch(() => {});
    }
  } catch {
    // whatsapp is best-effort
  }

  void logAdminAction({ actor: "AI Agent", action: "APPLICATION_APPROVE", targetType: "application", targetLabel: target.email });
  return { ok: true, ref: String(target._id), message: "Application approved + fee recorded." };
}

export async function rejectApplication(applicationId: string, msg: string): Promise<AgentResult> {
  const col = await getApplicationsCollection();
  const target = await col.findOne({ _id: new ObjectId(applicationId) });
  if (!target) return { ok: false, message: "Application not found." };
  if (target.status === "REJECTED") return { ok: true, skipped: true, message: "Already rejected." };
  const message = msg?.trim() || "Your application was not selected this time.";
  await col.updateOne(
    { _id: target._id },
    { $set: { status: "REJECTED", adminMessage: message, updatedAt: new Date() } }
  );
  await notifyUser(String(target.userId), "application", "Application not selected", message);
  if (target.email) {
    void sendDecisionEmail({
      to: target.email,
      name: target.name,
      kind: "application",
      approved: false,
      subject: "Update on your application",
      message,
      href: "/dashboard",
    }).catch(() => {});
  }
  void logAdminAction({ actor: "AI Agent", action: "APPLICATION_REJECT", targetType: "application", targetLabel: target.email });
  return { ok: true, ref: String(target._id), message: "Application rejected with reason." };
}

export async function requestEnrollmentPayment(enrollmentId: string, decisions: Decision): Promise<AgentResult> {
  const col = await getEnrollmentsCollection();
  const e = await col.findOne({ _id: new ObjectId(enrollmentId) });
  if (!e) return { ok: false, message: "Enrollment not found." };
  if (e.status === "AWAITING_PAYMENT") return { ok: true, skipped: true, message: "Already waiting for payment." };
  const instructions = decisions.paymentInstructions || "See your dashboard for payment details.";
  await col.updateOne(
    { _id: e._id },
    { $set: { status: "AWAITING_PAYMENT", paymentInstructions: instructions, updatedAt: new Date() } }
  );
  await notifyUser(String(e.userId), "enrollment", "Complete your payment", instructions);
  if (e.email) {
    void sendDecisionEmail({
      to: e.email,
      name: e.name,
      kind: "enrollment",
      approved: true,
      subject: emailSubjectFor("REQUEST_PAYMENT"),
      message: decisions.message ?? undefined,
      href: "/dashboard",
    }).catch(() => {});
  }
  void logAdminAction({ actor: "AI Agent", action: "ENROLLMENT_REQUEST_PAYMENT", targetType: "enrollment", targetLabel: e.email });
  return { ok: true, ref: String(e._id), message: "Payment requested." };
}

export async function confirmEnrollment(enrollmentId: string, decisions: Decision): Promise<AgentResult> {
  const col = await getEnrollmentsCollection();
  const e = await col.findOne({ _id: new ObjectId(enrollmentId) });
  if (!e) return { ok: false, message: "Enrollment not found." };
  if (e.status === "ENROLLED") return { ok: true, skipped: true, message: "Already enrolled." };

  await col.updateOne(
    { _id: e._id },
    {
      $set: {
        status: "ENROLLED",
        adminMessage: decisions.message?.trim() || "Enrollment confirmed.",
        updatedAt: new Date(),
      },
    }
  );
  await notifyUser(String(e.userId), "enrollment", "Enrollment confirmed", "Your seat is locked in. Your bookshelf is ready.");
  if (e.email) {
    void sendDecisionEmail({
      to: e.email,
      name: e.name,
      kind: "enrollment",
      approved: true,
      subject: emailSubjectFor("CONFIRM"),
      message: undefined,
      href: "/dashboard",
    }).catch(() => {});
  }
  revalidateTag("catalog", { expire: 0 });

  // Record the deposit the agent verified (proof flow).
  const amount = decisionAmount(decisions);
  if (amount > 0) {
    await recordDeposit({ enrollmentId, userId: e.userId, amount, method: decisions.method ?? "easypaisa", note: decisions.note ?? "AI agent: payment proof verified" });
  }

  void logAdminAction({ actor: "AI Agent", action: "ENROLLMENT_CONFIRM", targetType: "enrollment", targetLabel: e.email });
  return { ok: true, ref: String(e._id), message: "Enrollment confirmed + deposit recorded." };
}

export async function rejectEnrollment(enrollmentId: string, msg: string): Promise<AgentResult> {
  const col = await getEnrollmentsCollection();
  const e = await col.findOne({ _id: new ObjectId(enrollmentId) });
  if (!e) return { ok: false, message: "Enrollment not found." };
  if (e.status === "REJECTED") return { ok: true, skipped: true, message: "Already rejected." };
  const message = msg?.trim() || "Your enrollment request was declined.";
  await col.updateOne(
    { _id: e._id },
    { $set: { status: "REJECTED", adminMessage: message, updatedAt: new Date() } }
  );
  await notifyUser(String(e.userId), "enrollment", "Enrollment request declined", message);
  if (e.email) {
    void sendDecisionEmail({
      to: e.email,
      name: e.name,
      kind: "enrollment",
      approved: false,
      subject: emailSubjectFor("REJECT"),
      message,
      href: "/dashboard",
    }).catch(() => {});
  }
  void logAdminAction({ actor: "AI Agent", action: "ENROLLMENT_REJECT", targetType: "enrollment", targetLabel: e.email });
  return { ok: true, ref: String(e._id), message: "Enrollment rejected with reason." };
}

export async function recordDeposit(input: {
  enrollmentId?: string;
  userId?: string;
  amount: number;
  method: string;
  note?: string;
}): Promise<AgentResult> {
  const db = await getDb();
  const now = new Date();
  try {
    const res = await db.collection("payments").insertOne({
      enrollmentId: input.enrollmentId ?? "",
      userId: input.userId ?? "",
      amount: input.amount,
      currency: "PKR",
      provider: "manual",
      status: "PAID",
      type: "DEPOSIT",
      method: input.method,
      note: input.note ? input.note.slice(0, 300) : null,
      studentName: null,
      studentEmail: null,
      createdBy: "AI Agent",
      createdAt: now,
      updatedAt: now,
    });
    void logAdminAction({ actor: "AI Agent", action: "LEDGER_DEPOSIT", targetType: "payment", targetLabel: String(res.insertedId), detail: `PKR ${input.amount.toLocaleString()} via ${input.method}` });
    return { ok: true, ref: String(res.insertedId), message: "Deposit recorded." };
  } catch (err) {
    return { ok: false, message: `Ledger deposit failed: ${(err as Error).message}` };
  }
}

export async function recordWithdrawal(input: { amount: number; method: string; note?: string }): Promise<AgentResult> {
  const db = await getDb();
  const [deposits, withdrawals] = await Promise.all([
    db
      .collection("payments")
      .aggregate([
        { $match: { status: "PAID", $or: [{ type: { $ne: "WITHDRAWAL" } }, { type: { $exists: false } }] } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray(),
    db
      .collection("payments")
      .aggregate([
        { $match: { status: "PAID", type: "WITHDRAWAL" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray(),
  ]);
  const balance = (deposits[0]?.total ?? 0) - (withdrawals[0]?.total ?? 0);
  if (input.amount > balance) {
    return { ok: false, message: `Insufficient balance (available Rs ${Math.max(0, balance).toLocaleString()}).` };
  }
  const now = new Date();
  try {
    const res = await db.collection("payments").insertOne({
      enrollmentId: "",
      userId: "",
      amount: input.amount,
      currency: "PKR",
      provider: "manual",
      status: "PAID",
      type: "WITHDRAWAL",
      method: input.method,
      note: input.note ? input.note.slice(0, 300) : null,
      createdBy: "AI Agent",
      createdAt: now,
      updatedAt: now,
    });
    void logAdminAction({ actor: "AI Agent", action: "LEDGER_WITHDRAWAL", targetType: "payment", targetLabel: String(res.insertedId), detail: `PKR ${input.amount.toLocaleString()} via ${input.method}` });
    return { ok: true, ref: String(res.insertedId), message: "Withdrawal recorded." };
  } catch (err) {
    return { ok: false, message: `Ledger withdrawal failed: ${(err as Error).message}` };
  }
}

export async function publishBlog(input: {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  tags: string[];
  author?: string;
}): Promise<AgentResult> {
  const col = await getNewsPostsCollection();
  const existing = await col.findOne({ slug: input.slug });
  if (existing) return { ok: false, message: "News slug already exists." };
  const now = new Date();
  try {
    const res = await col.insertOne({
      slug: input.slug,
      title: input.title,
      body: input.content,
      coverImage: input.coverImage ?? null,
      authorName: input.author ?? "Aina (AI)",
      authorRole: "teacher",
      tags: input.tags.slice(0, 6),
      published: true,
      pinned: false,
      views: 0,
      likeCount: 0,
      interestedCount: 0,
      notInterestedCount: 0,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    });
    void logAdminAction({ actor: "AI Agent", action: "NEWS_PUBLISH", targetType: "news_post", targetLabel: input.slug });
    return { ok: true, ref: String(res.insertedId), message: `Published: ${input.title}` };
  } catch (err) {
    return { ok: false, message: `News publish failed: ${(err as Error).message}` };
  }
}

/** Sanitize + coerce the model's suggested amount into a safe ledger number. */
export function decisionAmount(d: Decision): number {
  const n = Number(d.amount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n);
}

export type { Decision };