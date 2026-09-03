import { describe, expect, it } from "vitest";
import {
  DemoBookingSchema,
  TestimonialSchema,
  EnrollmentSchema,
} from "../lib/validate";

describe("DemoBookingSchema", () => {
  it("accepts a valid booking", () => {
    const res = DemoBookingSchema.safeParse({
      name: "Hamza Khan",
      email: "hamza@example.com",
      phone: "+923001234567",
      preferredDate: "2026-09-15",
      preferredTime: "9:00 AM",
      course: "IELTS Preparation",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.phone).toBe("+923001234567");
      expect(res.data.course).toBe("IELTS Preparation");
    }
  });

  it("rejects a bad phone number", () => {
    const res = DemoBookingSchema.safeParse({
      name: "Hamza",
      email: "hamza@example.com",
      phone: "not-a-number",
      preferredDate: "2026-09-15",
      preferredTime: "9:00 AM",
      course: "Spoken English",
    });
    expect(res.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const res = DemoBookingSchema.safeParse({
      name: "Hamza",
      email: "nope",
      phone: "+923001234567",
      preferredDate: "2026-09-15",
      preferredTime: "9:00 AM",
      course: "PTE Preparation",
    });
    expect(res.success).toBe(false);
  });

  it("defaults message to empty string", () => {
    const res = DemoBookingSchema.safeParse({
      name: "Ayesha",
      email: "ayesha@example.com",
      phone: "03001234567",
      preferredDate: "2026-09-16",
      preferredTime: "1:00 PM",
      course: "Duolingo English Test",
    });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.message).toBe("");
  });
});

describe("TestimonialSchema", () => {
  it("accepts a valid testimonial", () => {
    const res = TestimonialSchema.safeParse({
      name: "Bilal Ahmed",
      role: "Working professional",
      quote: "Short, consistent sessions that fit around a 9-to-5.",
      outcome: "Cleared DET first attempt",
      course: "Duolingo English Test",
    });
    expect(res.success).toBe(true);
  });

  it("defaults role and outcome", () => {
    const res = TestimonialSchema.safeParse({
      name: "Fatima",
      quote: "Great coaching.",
      course: "IELTS",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.role).toBe("Student");
      expect(res.data.outcome).toBe("");
    }
  });
});

describe("EnrollmentSchema paymentMethod", () => {
  it("defaults payment method to easypaisa", () => {
    const res = EnrollmentSchema.safeParse({
      subjects: ["Spoken English"],
      batch: "Evening",
    });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.paymentMethod).toBe("easypaisa");
  });

  it("accepts each payment method", () => {
    for (const method of ["easypaisa", "jazzcash", "bank", "other"] as const) {
      const res = EnrollmentSchema.safeParse({
        subjects: ["IELTS Preparation"],
        batch: "Morning",
        paymentMethod: method,
      });
      expect(res.success).toBe(true);
    }
  });

  it("rejects an unknown payment method", () => {
    const res = EnrollmentSchema.safeParse({
      subjects: ["IELTS Preparation"],
      batch: "Morning",
      paymentMethod: "bitcoin",
    });
    expect(res.success).toBe(false);
  });
});
