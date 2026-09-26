import { describe, expect, it, afterEach, vi } from "vitest";
import { deriveAdminStats } from "../components/admin-panel/stats";
import type { AdminRegistration } from "../components/admin-panel/types";

function reg(partial: Partial<AdminRegistration> & { createdAt: string }): AdminRegistration {
  return {
    id: "r",
    ref: "LH-TEST-000001",
    userId: "u1",
    name: "Name",
    email: "e@example.com",
    course: "IELTS Exam Preparation",
    courseKey: "ielts",
    phone: "+92 300 1234567",
    address: "Gulberg, Lahore",
    dob: "2000-01-01",
    education: { qualification: "BS", institution: "UOL", yearOfPassing: "2022" },
    study: {
      preferredTime: "evening",
      focusModules: ["writing"],
      level: "average",
      hoursPerWeek: "6-10",
      heardAbout: "instagram",
      extras: null,
    },
    payment: { method: "Easypaisa", note: null, receipt: null, receiptName: null },
    status: "NEW",
    adminMessage: null,
    pdfAttached: true,
    ...partial,
  };
}

const counts = {
  users: 3,
  courses: 4,
  notifications: 5,
  regTotal: 4,
  regNew: 1,
  regContacted: 1,
  regEnrolled: 2,
};

const emptyCounts = {
  ...counts,
  regTotal: 0,
  regNew: 0,
  regContacted: 0,
  regEnrolled: 0,
};

describe("deriveAdminStats", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sums registration statuses via the full-table counts", () => {
    const s = deriveAdminStats([], counts);
    expect(s.total).toBe(4);
    expect(s.newCount).toBe(1);
    expect(s.contacted).toBe(1);
    expect(s.enrolled).toBe(2);
    expect(s.responseRate).toBe(Math.round((2 / 4) * 100));
  });

  it("passes through the server-side table counts", () => {
    const s = deriveAdminStats([], counts);
    expect(s.users).toBe(3);
    expect(s.courses).toBe(4);
    expect(s.notifications).toBe(5);
  });

  it("responseRate is 0 when there are no registrations", () => {
    const s = deriveAdminStats([], emptyCounts);
    expect(s.responseRate).toBe(0);
  });

  it("buckets createdAt into today / this week / this month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-15T12:00:00.000Z"));

    const now = new Date("2025-03-15T12:00:00.000Z");
    const hourAgo = new Date(now.getTime() - 1 * 3600_000).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 3 * 86_400_000).toISOString();
    const tenDaysAgo = new Date(now.getTime() - 10 * 86_400_000).toISOString();
    const fortyDaysAgo = new Date(now.getTime() - 40 * 86_400_000).toISOString();

    const regs = [
      reg({ id: "1", createdAt: hourAgo }),
      reg({ id: "2", createdAt: threeDaysAgo }),
      reg({ id: "3", createdAt: tenDaysAgo }),
      reg({ id: "4", createdAt: fortyDaysAgo }),
    ];

    const s = deriveAdminStats(regs, counts);

    expect(s.today).toBe(1);
    expect(s.thisWeek).toBe(2);
    expect(s.thisMonth).toBe(3);
    expect(s.total).toBe(4);
  });
});