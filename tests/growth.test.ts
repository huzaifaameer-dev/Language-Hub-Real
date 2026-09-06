import { describe, expect, it } from "vitest";
import { triageFallback } from "../lib/growth/triage";
import {
  completionPercent,
  shouldIssueCertificate,
  makeCertificateId,
  issueDate,
} from "../lib/growth/certificate";
import {
  freshWaitlistCandidates,
  offersFromVacancies,
  holdDeadline,
  onHoldApps,
  expiredHolds,
} from "../lib/growth/waitlist";
import { weekKey, staleLearners, nudgeCopy, digestCopy } from "../lib/growth/streaks";
import { initialReply, nextWaReply } from "../lib/growth/wa-flow";
import { offlineRecap } from "../lib/growth/recap";
import { offlineFlywheel } from "../lib/growth/flywheel";
import { offlineNlAnswer } from "../lib/growth/nl-query";
import { offlinePracticeReply, practiceFluencyLabel, practiceOpener } from "../lib/growth/practice";
import { offlineDemoBrief } from "../lib/growth/demo-brief";
import type { WeeklyMetrics } from "../lib/ai/weekly";

const app = (o: Partial<{
  bio: string;
  message: string;
  course: string;
  seats: { seatsLeft: number; full: boolean };
  placement: { level: string; recommendedCourse: string; overallScore: number } | null;
}>) => ({
  name: "Ali",
  email: "a@b.com",
  course: "IELTS Preparation",
  place: "Lahore",
  bio: "",
  message: "",
  createdAt: new Date(),
  ...o,
});

describe("triageFallback", () => {
  it("waitlists incomplete applications", () => {
    const r = triageFallback(app({}));
    expect(r.decision).toBe("WAITLIST");
    expect(r.reason).toMatch(/incomplete/i);
  });

  it("waitlists when the batch is full", () => {
    const r = triageFallback(app({ bio: "A short but complete introduction of me.", seats: { seatsLeft: 0, full: true } }));
    expect(r.decision).toBe("WAITLIST");
  });

  it("approves a complete, open-seat application", () => {
    const r = triageFallback(app({ bio: "A short but complete introduction of me.", message: "Want to join IELTS." }));
    expect(r.decision).toBe("APPROVE");
    expect(r.notes.length).toBeGreaterThan(0);
  });

  it("waitlists a low placement score for a high-band course", () => {
    const r = triageFallback(
      app({ bio: "A short but complete introduction of me.", placement: { level: "beginner", recommendedCourse: "Spoken English", overallScore: 42 } })
    );
    expect(r.decision).toBe("WAITLIST");
    expect(r.reason).toMatch(/foundation|score/i);
  });
});

describe("certificate helpers", () => {
  it("computes completion percent from chapters", () => {
    expect(completionPercent(null)).toBe(0);
    expect(completionPercent({ chapters: [{ completed: true }, { completed: false }, { completed: true }] })).toBe(67);
    expect(shouldIssueCertificate(80)).toBe(true);
    expect(shouldIssueCertificate(79)).toBe(false);
  });

  it("makes unique certificate ids with a date-yyyy shape", () => {
    const id = makeCertificateId();
    expect(id).toMatch(/^LH-[A-Z0-9]{5}-[A-Z0-9]{4}$/);
    expect(makeCertificateId()).not.toBe(id);
    expect(issueDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("waitlist helpers", () => {
  const now = new Date("2026-01-10T10:00:00Z");
  const mk = (id: string, course = "IELTS Preparation", createdAt = "2026-01-01") => ({
    _id: id,
    userId: id,
    email: `${id}@e.com`,
    name: id,
    course,
    status: "PENDING",
    createdAt: new Date(createdAt),
  }) as import("../lib/growth/waitlist").WaitlistApp;

  it("finds fresh candidates and hold/expiry windows", () => {
    const cand = mk("a");
    const held = { ...mk("b"), waitlistHoldUntil: new Date(now.getTime() + 3600000) };
    const expired = { ...mk("c"), waitlistHoldUntil: new Date(now.getTime() - 1000) };
    expect(freshWaitlistCandidates([cand, held, expired])).toHaveLength(1);
    expect(onHoldApps([cand, held, expired], now)).toHaveLength(1);
    expect(expiredHolds([cand, held, expired], now)).toHaveLength(1);
    expect(holdDeadline(now).getTime()).toBe(now.getTime() + 24 * 3600000);
  });

  it("offers seats oldest-first and never double-books", () => {
    const apps = [mk("a", "IELTS Preparation", "2026-01-02"), mk("b", "IELTS Preparation", "2026-01-01")];
    const vacancies = [{ course: "IELTS Preparation", batch: "Morning", seatsLeft: 1 }];
    const offers = offersFromVacancies(apps, vacancies);
    expect(offers).toHaveLength(1);
    expect(String(offers[0].app._id)).toBe("b");
    expect(vacancies[0].seatsLeft).toBe(0);
  });
});

describe("streak helpers", () => {
  it("computes stable ISO week keys", () => {
    expect(weekKey(new Date("2026-01-05T12:00:00Z"))).toBe("2026-W02");
    expect(weekKey(new Date("2026-01-05T12:00:00Z"))).toBe(weekKey(new Date("2026-01-07T12:00:00Z")));
  });

  it("flags only enrolled learners with stale progress", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    const fresh = { userId: "u1", updatedAt: new Date(now.getTime() - 60_000) };
    const stale = { userId: "u2", updatedAt: new Date(now.getTime() - 5 * 86400000) };
    const enrolled = [
      { userId: "u1", email: "a@e.com", name: "A", batch: "M", updatedAt: now },
      { userId: "u2", email: "b@e.com", name: "B", batch: "M", updatedAt: now },
    ];
    const result = staleLearners(enrolled as never, [fresh as never, stale as never], now);
    expect(result.map((r) => r.student.userId)).toEqual(["u2"]);
  });

  it("produces readable nudge + digest copy", () => {
    expect(nudgeCopy({ name: "Ali", subjects: ["IELTS Preparation"], batch: "Morning" })).toMatch(/Ali/);
    expect(digestCopy({ name: "Ali", subjects: ["PTE Preparation"] })).toMatch(/week/i);
  });
});

describe("whatsapp flow", () => {
  it("starts the funnel from a greeting", () => {
    const r = initialReply("Hi, I want to learn English");
    expect(r.patch.flow.stage).toBe("course");
    expect(r.lead).toBe(true);
  });

  it("walks course → batch → name → complete", () => {
    const s1 = nextWaReply({ stage: "course" }, "I want IELTS");
    expect(s1.patch.flow.stage).toBe("batch");
    expect(s1.patch.flow.course).toBe("IELTS Preparation");

    const s2 = nextWaReply(s1.patch.flow, "Evening");
    expect(s2.patch.flow.stage).toBe("name");
    expect(s2.patch.flow.batch).toBe("Evening");

    const s3 = nextWaReply(s2.patch.flow, "My name is Ayesha");
    expect(s3.completeDemo).toBe(true);
    expect(s3.patch.flow.stage).toBe("done");
    expect(s3.reply).toMatch(/placement test/i);
  });

  it("re-asks when the input does not match", () => {
    const s = nextWaReply({ stage: "batch" }, "anytime lol");
    expect(s.patch.flow.stage).toBe("batch");
  });
});

describe("recap offline", () => {
  it("produces a structured recap with homework", () => {
    const r = offlineRecap({ course: "Spoken English", topics: ["Greetings", "Questions"], batch: "Morning", notes: "Great energy.", studentEmails: ["s@e.com"] });
    expect(r.summary).toMatch(/Spoken English/);
    expect(r.homework).toMatch(/practice/i);
    expect(r.gaps[0].student).toBe("s@e.com");
  });
});

describe("flywheel offline", () => {
  it("yields a deterministic draft from the newest seed", () => {
    const seeds = [{ id: "abc123", kind: "essay", text: "My city", feedback: "Good start, link ideas.", grade: null, createdAt: new Date() }];
    const drafts = offlineFlywheel(seeds);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].title).toMatch(/essay|Basics/i);
    expect(drafts[0].offline).toBe(true);
  });
});

describe("nl-query offline", () => {
  const metrics = {
    period: { start: "", end: "", days: 7 },
    signups: 12,
    applications: { total: 8, pending: 2, approved: 5, rejected: 1 },
    enrollments: { total: 6, enrolled: 4, awaitingPayment: 2, rejected: 0, byCourse: [{ course: "IELTS Preparation", count: 3 }] },
    revenue: { amount: 140000, transactions: 10, withdrawals: 0 },
    leads: { placementTests: 5, demoBookings: 3, whatsapp: 4 },
    assignments: { submitted: 9, graded: 5 },
    progress: { activeLearners: 20, avgCompletionPct: 45 },
    certificates: { issued: 2 },
  } as WeeklyMetrics;

  it("answers revenue questions with PKR figures", () => {
    const a = offlineNlAnswer("How much revenue did we make?", metrics);
    expect(a).toMatch(/Rs 140,000/);
  });

  it("answers enrollment/course questions", () => {
    const a = offlineNlAnswer("Top courses by enrollment?", metrics);
    expect(a).toMatch(/IELTS Preparation/);
  });

  it("returns a default summary for unknown questions", () => {
    const a = offlineNlAnswer("weather today?", metrics);
    expect(a).toMatch(/signups/);
  });
});

describe("practice helpers", () => {
  it("returns topic openers and offline replies", () => {
    expect(practiceOpener("daily-routine")).toMatch(/morning/);
    expect(offlinePracticeReply("I like cricket", 2)).toMatch(/I love that/);
    expect(offlinePracticeReply("That is my daily routine. I wake up early.", 3)).toMatch(/finish/i);
  });

  it("labels fluency by transcript shape", () => {
    expect(practiceFluencyLabel(10, 1)).toBe("Warm-up");
    expect(practiceFluencyLabel(120, 10)).toBe("Fluent");
  });
});

describe("demo brief offline", () => {
  it("summarises the lead and gives talking points", () => {
    const b = offlineDemoBrief({
      name: "Fatima",
      course: "IELTS Preparation",
      preferredDate: "2026-01-20",
      preferredTime: "10:00",
      message: "I need Band 7",
      whatsappHistory: [],
      placement: { level: "intermediate", overallScore: 62, recommendedCourse: "IELTS Preparation" },
    });
    expect(b.leadSummary).toMatch(/Fatima/);
    expect(b.recommendedCourse).toBe("IELTS Preparation");
    expect(b.talkingPoints.length).toBeGreaterThanOrEqual(3);
    expect(b.offline).toBe(true);
  });
});