import { z } from "zod";

export const PasswordSchema = z
  .string()
  .min(8, "Be at least 8 characters long.")
  .max(72, "Password too long.")
  .regex(/[A-Za-z]/, "Contain at least one letter.")
  .regex(/[0-9]/, "Contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Contain at least one special character.");

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(60, "Name is too long.")
    .trim(),
  email: z.email("Enter a valid email address.").max(120).trim(),
  password: PasswordSchema,
});

export const ProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(60, "Name is too long.")
    .trim(),
  whatsapp: z
    .string()
    .trim()
    .max(24, "WhatsApp number is too long.")
    .regex(
      /^$|^\+?[0-9][0-9\s\-()]{4,22}[0-9]$/,
      "Enter a valid WhatsApp number (digits, spaces, +, - allowed)."
    )
    .optional(),
});

export const PasswordChangeSchema = z.object({
  current: z.string().min(1, "Enter your current password.").max(72),
  next: PasswordSchema,
});

export const AccountDeleteSchema = z.object({
  password: z.string().min(1, "Enter your password to confirm.").max(72),
});

export const ApplicationSchema = z.object({
  name: z.string().min(2, "Name is required.").max(80).trim(),
  place: z.string().min(2, "Place is required.").max(120).trim(),
  bio: z
    .string()
    .min(10, "Tell us a bit more (at least 10 characters).")
    .max(600, "Bio too long."),
  course: z
    .enum(["Spoken English", "IELTS Preparation", "PTE Preparation", "Duolingo English Test"])
    .or(z.string().min(1, "Choose a course.")),
  message: z.string().max(600, "Message too long.").trim().optional().default(""),
});

export const EnrollmentSchema = z.object({
  subjects: z
    .array(
      z.enum([
        "Spoken English",
        "IELTS Preparation",
        "PTE Preparation",
        "Duolingo English Test",
      ])
    )
    .min(1, "Select at least one subject.")
    .max(4, "You can select up to four subjects."),
  batch: z
    .string()
    .min(1, "Choose a batch.")
    .max(50, "Batch name is too long.")
    .trim(),
  plan: z.string().max(800, "Keep it under 800 characters.").trim().optional().default(""),
});

export function fieldErrors(result: { success: boolean; error?: z.ZodError }): Record<string, string[]> | null {
  if (!result.success && result.error) {
    return z.flattenError(result.error).fieldErrors as Record<string, string[]>;
  }
  return null;
}