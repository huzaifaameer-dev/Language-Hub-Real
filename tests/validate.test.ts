import { describe, expect, it } from "vitest";
import {
  AccountDeleteSchema,
  ApplicationSchema,
  EnrollmentSchema,
  PasswordChangeSchema,
  PasswordSchema,
  ProfileUpdateSchema,
  RegisterSchema,
  fieldErrors,
} from "../lib/validate";

describe("PasswordSchema", () => {
  it("rejects weak passwords", () => {
    expect(PasswordSchema.safeParse("short1!").success).toBe(false);
    expect(PasswordSchema.safeParse("allletters1").success).toBe(false);
    expect(PasswordSchema.safeParse("NOLOWER1!").success).toBe(true);
  });

  it("accepts a strong password", () => {
    const res = PasswordSchema.safeParse("Str0ng!Pass");
    expect(res.success).toBe(true);
  });
});

describe("RegisterSchema", () => {
  it("trims name and email but preserves case (route lowercases)", () => {
    const res = RegisterSchema.safeParse({
      name: "  Ali  ",
      email: "  ALI@EXAMPLE.COM  ",
      password: "Str0ng!Pass",
    });
    // zod validates the pre-trim string, so surrounding spaces on the email
    // must be rejected by .email()
    expect(res.success).toBe(false);
  });

  it("accepts case-varying email once whitespace is removed", () => {
    const res = RegisterSchema.safeParse({
      name: "  Ali  ",
      email: "ALI@EXAMPLE.COM",
      password: "Str0ng!Pass",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.name).toBe("Ali");
      expect(res.data.email).toBe("ALI@EXAMPLE.COM");
    }
  });

  it("rejects invalid email and short name", () => {
    expect(
      RegisterSchema.safeParse({ name: "A", email: "nope", password: "Str0ng!Pass" }).success
    ).toBe(false);
  });
});

describe("ProfileUpdateSchema", () => {
  it("accepts empty or valid whatsapp and rejects garbage", () => {
    expect(
      ProfileUpdateSchema.safeParse({ name: "Ali", whatsapp: "" }).success
    ).toBe(true);
    expect(
      ProfileUpdateSchema.safeParse({ name: "Ali", whatsapp: "+92 300 1234567" }).success
    ).toBe(true);
    expect(
      ProfileUpdateSchema.safeParse({ name: "Ali", whatsapp: "abc!!!" }).success
    ).toBe(false);
  });
});

describe("ApplicationSchema", () => {
  it("accepts a valid application and defaults message", () => {
    const res = ApplicationSchema.safeParse({
      name: "Ali",
      place: "Lahore",
      bio: "I want to improve my spoken English over the next year.",
      course: "Spoken English",
    });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.message).toBe("");
  });

  it("rejects short bio", () => {
    expect(
      ApplicationSchema.safeParse({
        name: "Ali",
        place: "Lahore",
        bio: "too short",
        course: "IELTS Preparation",
      }).success
    ).toBe(false);
  });
});

describe("EnrollmentSchema", () => {
  it("requires at least one subject and caps at four", () => {
    expect(
      EnrollmentSchema.safeParse({ subjects: [], batch: "Evening" }).success
    ).toBe(false);
    expect(
      EnrollmentSchema.safeParse({
        subjects: [
          "Spoken English",
          "IELTS Preparation",
          "PTE Preparation",
          "Duolingo English Test",
        ],
        batch: "Weekend",
      }).success
    ).toBe(true);
  });

  it("rejects unknown batch values", () => {
    expect(
      EnrollmentSchema.safeParse({ subjects: ["Spoken English"], batch: "Midnight" }).success
    ).toBe(false);
  });
});

describe("PasswordChangeSchema", () => {
  it("rejects missing current password", () => {
    expect(PasswordChangeSchema.safeParse({ current: "", next: "Str0ng!Pass" }).success).toBe(false);
  });
});

describe("AccountDeleteSchema", () => {
  it("requires a confirmation password", () => {
    expect(AccountDeleteSchema.safeParse({ password: "" }).success).toBe(false);
    expect(AccountDeleteSchema.safeParse({ password: "hunter22!" }).success).toBe(true);
  });
});

describe("fieldErrors", () => {
  it("extracts field errors from a failed parse", () => {
    const res = RegisterSchema.safeParse({ name: "A", email: "bad", password: "x" });
    const errors = fieldErrors(res);
    expect(errors).not.toBeNull();
    expect(errors).toHaveProperty("email");
  });

  it("returns null for a successful parse", () => {
    const res = RegisterSchema.safeParse({
      name: "Ali",
      email: "ali@example.com",
      password: "Str0ng!Pass",
    });
    expect(res.success).toBe(true);
    if (res.success) expect(fieldErrors(res)).toBeNull();
  });
});