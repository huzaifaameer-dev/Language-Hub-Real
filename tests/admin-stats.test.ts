import { describe, expect, it, afterEach, vi } from "vitest";
import { deriveAdminStats } from "../components/admin-panel/stats";
import type {
  AdminApplication,
  AdminEnrollment,
} from "../components/admin-panel/types";

function app(partial: Partial<AdminApplication> & { createdAt: string }): AdminApplication {
  return {
    id: "a",
    name: "Name",
    email: "e@example.com",
    place: "Karachi",
    bio: "bio",
    course: "English",
    status: "PENDING",
    adminMessage: null,
    ...partial,
  };
}

function enr(partial: Partial<AdminEnrollment> & { createdAt: string }): AdminEnrollment {
  return {
    id: "e",
    name: "Name",
    email: "e@example.com",
    subjects: ["English"],
    batch: "B1",
    status: "PENDING",
    adminMessage: null,
    ...partial,
  };
}

const counts = {
  users: 3,
  courses: 4,
  notifications: 5,
  paymentsTotal: 0,
  appsTotal: 4,
  appsPending: 1,
  appsApproved: 2,
  appsRejected: 1,
  enrsPending: 1,
  enrsAwaiting: 0,
  enrsProof: 0,
  enrsEnrolled: 1,
  enrsRejected: 1,
};

const emptyCounts = {
  ...counts,
  appsTotal: 0,
  appsPending: 0,
  appsApproved: 0,
  appsRejected: 0,
};

describe("deriveAdminStats", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sums application statuses and enrollment statuses", () => {
    const apps = [
      app({ id: "1", status: "PENDING", createdAt: "2025-03-01T10:00:00Z" }),
      app({ id: "2", status: "APPROVED", createdAt: "2025-03-02T10:00:00Z" }),
      app({ id: "3", status: "APPROVED", createdAt: "2025-03-03T10:00:00Z" }),
      app({ id: "4", status: "REJECTED", createdAt: "2025-03-04T10:00:00Z" }),
    ];
    const enrs = [
      enr({ id: "e1", status: "PENDING", createdAt: "2025-03-01T10:00:00Z" }),
      enr({ id: "e2", status: "ENROLLED", createdAt: "2025-03-02T10:00:00Z" }),
      enr({ id: "e3", status: "REJECTED", createdAt: "2025-03-03T10:00:00Z" }),
    ];

    const s = deriveAdminStats(apps, enrs, counts);

    expect(s.total).toBe(4);
    expect(s.pending).toBe(1);
    expect(s.approved).toBe(2);
    expect(s.rejected).toBe(1);
    expect(s.enrPending).toBe(1);
    expect(s.enrEnrolled).toBe(1);
    expect(s.enrRejected).toBe(1);
    expect(s.approvalRate).toBe(50);
  });

  it("passes through the server-side table counts", () => {
    const s = deriveAdminStats([], [], counts);
    expect(s.users).toBe(3);
    expect(s.courses).toBe(4);
    expect(s.notifications).toBe(5);
    expect(s.total).toBe(4);
    expect(s.pending).toBe(1);
    expect(s.approved).toBe(2);
    expect(s.rejected).toBe(1);
    expect(s.enrPending).toBe(1);
    expect(s.enrEnrolled).toBe(1);
    expect(s.enrRejected).toBe(1);
  });

  it("uses the full-table counts even when the capped lists undercount", () => {
    const bigCounts = {
      ...counts,
      appsTotal: 500,
      appsPending: 12,
      appsApproved: 400,
      appsRejected: 88,
      enrsPending: 30,
      enrsEnrolled: 200,
      enrsRejected: 15,
    };
    const s = deriveAdminStats([], [], bigCounts);
    expect(s.total).toBe(500);
    expect(s.pending).toBe(12);
    expect(s.approved).toBe(400);
    expect(s.rejected).toBe(88);
    expect(s.enrPending).toBe(30);
    expect(s.enrEnrolled).toBe(200);
    expect(s.enrRejected).toBe(15);
    expect(s.approvalRate).toBe(Math.round((400 / 500) * 100));
  });

  it("approvalRate is 0 when there are no applications", () => {
    const s = deriveAdminStats([], [], emptyCounts);
    expect(s.approvalRate).toBe(0);
  });

  it("buckets createdAt into today / this week / this month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-15T12:00:00.000Z"));

    const now = new Date("2025-03-15T12:00:00.000Z");
    const hourAgo = new Date(now.getTime() - 1 * 3600_000).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 3 * 86_400_000).toISOString();
    const tenDaysAgo = new Date(now.getTime() - 10 * 86_400_000).toISOString();
    const fortyDaysAgo = new Date(now.getTime() - 40 * 86_400_000).toISOString();

    const apps = [
      app({ id: "1", createdAt: hourAgo }),
      app({ id: "2", createdAt: threeDaysAgo }),
      app({ id: "3", createdAt: tenDaysAgo }),
      app({ id: "4", createdAt: fortyDaysAgo }),
    ];

    const s = deriveAdminStats(apps, [], counts);

    expect(s.today).toBe(1);
    expect(s.thisWeek).toBe(2);
    expect(s.thisMonth).toBe(3);
    expect(s.total).toBe(4);
  });
});