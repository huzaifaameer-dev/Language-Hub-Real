/**
 * Stateful WhatsApp onboarding flow — turns a raw inbound message plus the
 * caller's stored flow stage into the next prompt (and a state patch). Pure so
 * it is unit-testable; the webhook persists the patch and side effects.
 */

export type WaStage = "greet" | "course" | "batch" | "name" | "done";

export interface WaFlowState {
  stage?: WaStage;
  course?: string | null;
  batch?: string | null;
  name?: string | null;
  startedAt?: string | null;
}

export interface WaFlowPatch {
  flow: WaFlowState;
}

export interface WaFlowReply {
  reply: string;
  lead: boolean;
  category?: string;
  /** When true the webhook should create a demo booking from captured data. */
  completeDemo?: boolean;
  demoLabel?: string;
  patch: WaFlowPatch;
}

const COURSES = [
  ["ielts", "IELTS Preparation"],
  ["pte", "PTE Preparation"],
  ["duolingo", "det", "Duolingo English Test"],
  ["spoken", "english", "Spoken English"],
] as const;

function matchCourse(text: string): string | null {
  const t = text.toLowerCase();
  for (const group of COURSES) {
    const label = group[group.length - 1];
    const keys = group.slice(0, -1);
    if (keys.some((k) => t.includes(k))) return label;
  }
  return null;
}

function matchBatch(text: string): string | null {
  const t = text.toLowerCase();
  if (/(morning|subah|صبح)/.test(t)) return "Morning";
  if (/(evening|shaam|شام)/.test(t)) return "Evening";
  if (/(weekend|afternoon|weekend)/.test(t)) return "Weekend";
  if (t.includes("1")) return "Morning";
  if (t.includes("2")) return "Evening";
  if (t.includes("3")) return "Weekend";
  return null;
}

export function initialReply(text: string): WaFlowReply {
  const t = text.toLowerCase();
  if (/(fee|price|cost|charges|rate)/.test(t)) {
    return {
      reply:
        "Our monthly fees: Spoken English Rs 8,000 · IELTS Rs 12,000 · PTE Rs 12,000 · Duolingo Rs 6,000. Want me to book you a free demo class?",
      lead: true,
      category: "pricing",
      patch: { flow: { stage: "greet" } },
    };
  }
  return {
    reply:
      "Assalam o alaikum! 👋 I'm the Language Hub assistant. Which course are you interested in? 1) Spoken English, 2) IELTS, 3) PTE, 4) Duolingo — or type the name.",
    lead: true,
    category: "greet",
    patch: { flow: { stage: "course", startedAt: new Date().toISOString() } },
  };
}

/**
 * Advance the conversation one step. Returns the next prompt and the flow
 * state to persist. When the funnel completes, `completeDemo` is true and the
 * caller should insert a PENDING demo booking + notify admins.
 */
export function nextWaReply(state: WaFlowState, text: string): WaFlowReply {
  const stage = state.stage ?? "greet";

  if (stage === "course") {
    const course = matchCourse(text);
    if (!course) {
      return {
        reply:
          "No worries! Choose one: Spoken English, IELTS, PTE or Duolingo — or type 'help' and I'll assist manually.",
        lead: true,
        category: "course",
        patch: { flow: { ...state, stage: "course" } },
      };
    }
    return {
      reply: `Great choice — ${course}! Which timing works best: 1) Morning, 2) Evening, or 3) Weekend?`,
      lead: true,
      category: "course",
      patch: { flow: { ...state, stage: "batch", course } },
    };
  }

  if (stage === "batch") {
    const batch = matchBatch(text);
    if (!batch) {
      return {
        reply: "Which timing? Reply 1 (Morning), 2 (Evening) or 3 (Weekend).",
        lead: true,
        category: "batch",
        patch: { flow: { ...state, stage: "batch" } },
      };
    }
    return {
      reply: `Perfect — ${state.course}, ${batch} batch. What's your first name so the team can address you properly?`,
      lead: true,
      category: "batch",
      patch: { flow: { ...state, stage: "name", batch } },
    };
  }

  if (stage === "name") {
    const name = (text.trim().split(/\s+/)[0] ?? "there").slice(0, 40);
    return {
      reply: `Shukriya, ${name}! I've noted your demo request. Our team will WhatsApp you shortly to confirm the time. Meanwhile, try the free placement test at the website to see your current level.`,
      lead: true,
      category: "demo",
      completeDemo: true,
      demoLabel: `${state.course} · ${state.batch ?? "TBD"}`,
      patch: { flow: { ...state, stage: "done", name } },
    };
  }

  // done (or unknown): fall back to the simple funnel for repeat messages.
  if (matchCourse(text)) {
    return {
      reply:
        "Got it! You can also book instantly on the website — the free placement test will recommend the right course for you first.",
      lead: false,
      category: "course",
      patch: { flow: { ...state, stage: "done" } },
    };
  }

  return {
    reply:
      "I can help you book a free demo class, pick a course or check fees. Which would you like?",
    lead: false,
    patch: { flow: { ...state, stage: "course" } },
  };
}

/** True when the inbound text looks like it should re-enter the funnel flow. */
export function shouldRunFlow(text: string): boolean {
  const t = text.toLowerCase();
  return !/(demo|book)/.test(t) || /course|ielts|pte|duolingo|spoken|batch|timing|fee/.test(t);
}