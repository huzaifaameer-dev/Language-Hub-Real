import { describe, expect, it } from "vitest";
import {
  batchUsageFor,
  seatsUsedFor,
  seatViews,
  type EnrolledLike,
} from "../lib/seat-math";

describe("batchUsageFor", () => {
  it("scopes usage to (course, batch) so same-named batches do not mix", () => {
    const enrolled: EnrolledLike[] = [
      { batch: "Morning", subjects: ["Spoken English"] },
      { batch: "Morning", subjects: ["IELTS Preparation"] },
      { batch: "Evening", subjects: ["Spoken English"] },
    ];
    const used = batchUsageFor(enrolled);

    expect(seatsUsedFor(used, "Spoken English", "Morning")).toBe(1);
    expect(seatsUsedFor(used, "IELTS Preparation", "Morning")).toBe(1);
    expect(seatsUsedFor(used, "Spoken English", "Evening")).toBe(1);
    expect(seatsUsedFor(used, "IELTS Preparation", "Evening")).toBe(0);
  });

  it("attributes one seat toward every subject the enrollment selects", () => {
    const enrolled: EnrolledLike[] = [
      { batch: "Saturday", subjects: ["Spoken English", "IELTS Preparation"] },
    ];
    const used = batchUsageFor(enrolled);

    expect(seatsUsedFor(used, "Spoken English", "Saturday")).toBe(1);
    expect(seatsUsedFor(used, "IELTS Preparation", "Saturday")).toBe(1);
  });

  it("legacy enrollments without subjects count toward every course at that batch", () => {
    const enrolled: EnrolledLike[] = [{ batch: "Evening" }];
    const used = batchUsageFor(enrolled);

    expect(seatsUsedFor(used, "Spoken English", "Evening")).toBe(1);
    expect(seatsUsedFor(used, "PTE Preparation", "Evening")).toBe(1);
    expect(seatsUsedFor(used, "Spoken English", "Morning")).toBe(0);
  });
});

describe("seatViews", () => {
  const batches = [
    { name: "Morning", time: "9:00", seatsTotal: 2 },
    { name: "Evening", time: "6:00", seatsTotal: 2 },
  ];

  it("reports per-course usage against the right capacity", () => {
    const used = batchUsageFor([
      { batch: "Morning", subjects: ["Spoken English"] },
      { batch: "Morning", subjects: ["Spoken English"] },
    ]);

    const views = seatViews(batches, used, "Spoken English");
    expect(views[0]).toMatchObject({ seatsUsed: 2, seatsLeft: 0, full: true });
    expect(views[1]).toMatchObject({ seatsUsed: 0, seatsLeft: 2, full: false });
  });

  it("ignores usage from other courses with the same batch name", () => {
    const used = batchUsageFor([
      { batch: "Morning", subjects: ["IELTS Preparation"] },
      { batch: "Morning", subjects: ["IELTS Preparation"] },
      { batch: "Morning", subjects: ["IELTS Preparation"] },
    ]);

    const views = seatViews(batches, used, "Spoken English");
    expect(views[0]).toMatchObject({ seatsUsed: 0, seatsLeft: 2, full: false });
  });
});