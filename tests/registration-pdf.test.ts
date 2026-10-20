import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildRegistrationPdf } from "@/lib/registration-pdf";

const JPG = readFileSync(path.join(process.cwd(), "public", "lang-logo.jpg"));

describe("registration pdf", () => {
  it("builds a valid pdf with photo + payment proof", async () => {
    const pdf = await buildRegistrationPdf({
      ref: "LH-20260101-ABCDEF",
      name: "Ayesha Khan",
      email: "ayesha@example.com",
      course: "IELTS Preparation",
      tagline: "Reach Band 6.5+",
      dob: "2001-05-12",
      phone: "+92 300 1234567",
      address: "House 12, Street 4, F-8, Islamabad, Pakistan",
      education: { qualification: "Bachelors", institution: "Quaid-e-Azam University", yearOfPassing: "2023" },
      study: {
        preferredTime: "Evening",
        focusModules: ["Speaking", "Writing"],
        level: "Intermediate",
        hoursPerWeek: "6-8",
        heardAbout: "Instagram",
        extras: null,
      },
      payment: { method: "Easypaisa", note: "Paid half", receiptName: "receipt.jpg" },
      feeLabel: "PKR 12,000",
      feeNote: "Due before first class",
      photo: { buffer: JPG, mime: "image/jpeg" },
      paymentProof: { buffer: JPG, mime: "image/jpeg" },
      createdAt: new Date(),
    });
    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  }, 20000);

  it("builds without photo or proof", async () => {
    const pdf = await buildRegistrationPdf({
      ref: "LH-20260101-AAAAAA",
      name: "Bilal",
      email: "b@example.com",
      course: "Spoken English",
      dob: "1999-01-01",
      phone: "0300",
      address: "Lahore",
      education: { qualification: "FSc", institution: "Govt College", yearOfPassing: "2018" },
      study: { preferredTime: "Morning", focusModules: [], level: "Beginner", hoursPerWeek: "3", heardAbout: "Friend", extras: null },
      payment: { method: "Bank Account", note: null, receiptName: null },
      feeLabel: "PKR 9,000",
      feeNote: "—",
      photo: null,
      paymentProof: null,
      createdAt: new Date(),
    });
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  }, 20000);

  it("does not hang on an unreadable image", async () => {
    const bad = Buffer.from("not-an-image");
    const pdf = await buildRegistrationPdf({
      ref: "LH-20260101-BADBAD",
      name: "Sara",
      email: "s@example.com",
      course: "PTE",
      dob: "2000-01-01",
      phone: "0300",
      address: "Karachi",
      education: { qualification: "BA", institution: "KU", yearOfPassing: "2020" },
      study: { preferredTime: "Evening", focusModules: [], level: "Advanced", hoursPerWeek: "8", heardAbout: "Ads", extras: null },
      payment: { method: "Easypaisa", note: null, receiptName: "bad.webp" },
      feeLabel: "PKR 10,000",
      feeNote: "—",
      photo: { buffer: bad, mime: "image/webp" },
      paymentProof: { buffer: bad, mime: "image/webp" },
      createdAt: new Date(),
    });
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  }, 20000);
});

