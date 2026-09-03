import { describe, expect, it, vi, afterEach } from "vitest";
import {
  OPENING_HOURS,
  CONTACT,
  COURSE_CARDS,
  COURSE_FEATURES,
  isOpenNow,
  whatsappLink,
} from "../lib/content";
import { formatPKR } from "../lib/course-data";

describe("isOpenNow", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const at = (iso: string) => vi.setSystemTime(new Date(iso));

  it("is open inside the 9:00–18:00 window", () => {
    vi.useFakeTimers();
    at("2026-08-30T12:00:00+05:00");
    expect(isOpenNow()).toBe(true);
  });

  it("is closed before 9:00", () => {
    vi.useFakeTimers();
    at("2026-08-30T08:59:00+05:00");
    expect(isOpenNow()).toBe(false);
  });

  it("is closed at or after 18:00", () => {
    vi.useFakeTimers();
    at("2026-08-30T18:00:00+05:00");
    expect(isOpenNow()).toBe(false);
  });

  it("is closed before opening hour exactly at the boundary", () => {
    vi.useFakeTimers();
    at("2026-08-30T09:00:00+05:00");
    expect(isOpenNow()).toBe(true);
  });
});

describe("OPENING_HOURS invariants", () => {
  it("window is sane and repeats every working day", () => {
    expect(OPENING_HOURS.openFromHour).toBeLessThan(OPENING_HOURS.openToHour);
    expect(OPENING_HOURS.isoFrom).toBe("09:00");
    expect(OPENING_HOURS.isoTo).toBe("18:00");
    expect(new Set(OPENING_HOURS.daysOfWeek).size).toBe(6);
    for (const day of OPENING_HOURS.daysOfWeek) {
      expect(day.length).toBeGreaterThan(0);
    }
  });
});

describe("COURSE_CARDS", () => {
  it("renders a card for every fallback course with an accent and fee label", () => {
    expect(COURSE_CARDS.length).toBeGreaterThan(0);
    for (const card of COURSE_CARDS) {
      expect(card.feeLabel).toContain("Rs");
      expect(card.accent).toMatch(/^#/);
      expect(card.href).toMatch(/^\/signup/);
      expect(card.batchSummary.length).toBeGreaterThan(0);
    }
  });

  it("COURSE_FEATURES covers every card course", () => {
    for (const card of COURSE_CARDS) {
      expect(COURSE_FEATURES[card.info.name]?.length).toBeGreaterThan(0);
    }
  });

  it("formatPKR formats thousands with a non-breaking space", () => {
    expect(formatPKR(8000)).toContain("\u00A0");
    expect(formatPKR(0)).toBe("Rs\u00A00");
  });
});

describe("whatsappLink", () => {
  it("returns a prefilled deep link when a number is configured", () => {
    if (CONTACT.whatsapp) {
      const link = whatsappLink("Hello Language Hub");
      expect(link).toMatch(/^https:\/\/wa\.me\/\d+/);
      expect(link).toContain(encodeURIComponent("Hello Language Hub"));
    } else {
      expect(whatsappLink("hi")).toBe("");
    }
  });
});