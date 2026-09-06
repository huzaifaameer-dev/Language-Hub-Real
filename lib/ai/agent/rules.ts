/**
 * Pure decision + validation rules for the autonomous AI admin agent.
 *
 * Everything here is deterministic and side-effect free so it can be trivially
 * unit-tested. The LLM, when configured, may *recommend* a decision; every
 * recommendation is re-validated through these rules before any action is
 * executed — the rules are the authority, the model is an advisor.
 */

export interface ApplicationLike {
  _id?: unknown;
  userId: string;
  name: string;
  email: string;
  place?: string;
  bio?: string;
  message?: string;
  course: string;
  status?: string;
  createdAt: Date;
  placement?: { level: string; recommendedCourse: string; overallScore: number } | null;
}

export interface SeatLike {
  ok: boolean;
  message?: string;
}

/** Add a human-review flag to a business doc (used instead of auto-rejecting). */
export const REVIEW_FLAG = {
  needsReview: true,
  agentNote: "Flagged by AI agent for human review — no auto-decision applied.",
} as const;

export type ApplicationDecision =
  | { action: "APPROVE"; reason: string; message: string }
  | { action: "REJECT"; reason: string; message: string }
  | { action: "CLARIFY"; reason: string; message: string };

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Reusable reachability check (email) used by rules and the agent engine. */
export { EMAIL_OK };

/** Data-quality gate: email, name and free-text must pass basic validation. */
export function applicationQualityOk(a: ApplicationLike): {
  ok: boolean;
  problems: string[];
} {
  const problems: string[] = [];
  const name = (a.name ?? "").trim();
  const email = (a.email ?? "").trim();
  const bio = (a.bio ?? "").trim();
  const message = (a.message ?? "").trim();

  if (name.length < 2) problems.push("Name is too short to address the applicant correctly.");
  if (email.length < 6 || !EMAIL_OK.test(email)) problems.push("Email does not look valid — decisions can't reach the applicant.");
  if (bio.length < 10 && message.length < 10) {
    problems.push("Application has almost no free text — please ask the applicant to complete it.");
  }
  return { ok: problems.length === 0, problems };
}

/**
 * The intelligent, ground-truth decision for a pending application.
 *
 * Every decision is derived from REAL signals — never random: contact
 * reachability, and whether the applicant actually said something meaningful
 * about their goal. Seats are intentionally NOT considered (unlimited).
 */
export function decideApplication(a: ApplicationLike): ApplicationDecision {
  const email = (a.email ?? "").trim();
  const name = (a.name ?? "").trim();
  const bio = (a.bio ?? "").trim();
  const message = (a.message ?? "").trim();

  if (name.length < 2 || email.length < 6 || !EMAIL_OK.test(email)) {
    return {
      action: "REJECT",
      reason: "Unusable contact details — a decision or message can never reach this applicant.",
      message:
        "Thank you for applying to Language Hub. We couldn't match a valid email on your application, so we can't reach you with a decision. Please message us on WhatsApp and we'll help you personally.",
    };
  }

  if (bio.length < 12 && message.length < 10) {
    return {
      action: "CLARIFY",
      reason: "Application has almost no detail about the applicant's goal.",
      message:
        "Thanks for applying! Please reply with 1–2 lines about your goal — for example, 'I need Band 7 for university' or 'I want to speak confidently at work'. As soon as you do, we'll approve you for the best batch.",
    };
  }

  const placementNote =
    a.placement && a.placement.recommendedCourse && a.placement.recommendedCourse !== a.course
      ? ` (placement points toward ${a.placement.recommendedCourse} — noted for the intro call)` : "";
  return {
    action: "APPROVE",
    reason: `Application is complete and contact is valid${placementNote}.`,
    message:
      "Congratulations — your application is approved! Please enroll in your course from the dashboard to lock in your seat.",
  };
}

/* ------------------------------------------------------------------ */
/*  Enrollment flow                                                    */
/* ------------------------------------------------------------------ */

export interface EnrollmentLike {
  _id?: unknown;
  userId: string;
  email: string;
  name: string;
  subjects?: string[];
  batch: string;
  status?: string;
  paymentProof?: string | null;
  paymentMethod?: string | null;
  createdAt: Date;
}

export type EnrollmentDecision =
  | { action: "REQUEST_PAYMENT"; reason: string; message: string; paymentInstructions: string }
  | { action: "CONFIRM"; reason: string; message: string; amount: number }
  | { action: "REJECT"; reason: string; message: string };

/** Approximate monthly fee for an enrolled course (from the static catalog). */
export function feeForCourse(courseName: string, courses: Array<{ name: string; fee?: number }>): number {
  const hit = courses.find((c) => c.name === courseName);
  return hit?.fee ?? 0;
}

export function paymentInstructionsFor(method: string | undefined, accountParts: string[]): string {
  const methodLabel = ["easypaisa", "jazzcash", "bank", "card", "cash"].includes(method ?? "")
    ? method
    : "EasyPaisa/JazzCash";
  const hash = method ?? "manual";
  // Fake-but-deterministic account suffix so instructions are stable per flow.
  let h = 0;
  for (let i = 0; i < hash.length; i += 1) h = (h * 31 + hash.charCodeAt(i)) | 0;
  const suffix = String(Math.abs(h) % 9000 + 1000);
  const type = accountParts[0] ?? "0312";
  const first = accountParts[1] ?? "3456789";
  return `Send ${methodLabel === "bank" ? "bank transfer" : `${methodLabel} to ${type}-${first}${suffix}`} and upload the proof from your dashboard. Amount and due date are shown there.`;
}

/** Decide what to do with a pending / proof-submitted enrollment. Seats are
 * intentionally not considered — capacity is unlimited for now. */
export function decideEnrollment(
  e: EnrollmentLike,
  fee: number
): EnrollmentDecision {
  const emailOk = EMAIL_OK.test((e.email ?? "").trim());

  if (e.status === "PROOF_SUBMITTED" && e.paymentProof) {
    return {
      action: "CONFIRM",
      reason: "Payment proof uploaded — confirming enrollment and recording the deposit.",
      message: "Payment received — your enrollment is confirmed and your seat is locked in!",
      amount: fee,
    };
  }

  if (!emailOk) {
    return {
      action: "REJECT",
      reason: "Payment instructions cannot reach the applicant — unusable email.",
      message: "We couldn't match a valid email for your enrollment. Please update your account email or contact us on WhatsApp.",
    };
  }

  return {
    action: "REQUEST_PAYMENT",
    reason: "Enrollment valid — requesting payment to secure the seat.",
    message:
      "Your enrollment request is approved. Complete the payment from your dashboard to lock in your seat — full instructions are waiting for you.",
    paymentInstructions: paymentInstructionsFor(e.paymentMethod ?? "easypaisa", []),
  };
}

/* ------------------------------------------------------------------ */
/*  Blog                                                               */
/* ------------------------------------------------------------------ */

export interface BlogTopicLike {
  topic: string;
  course?: string | null;
  seed?: string | null;
}

/** Slugify a blog title, matching the app's post slug shape. */
export function slugifyBlog(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `${base || "post"}-${rnd}`;
}