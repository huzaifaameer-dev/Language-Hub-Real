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
  phone: z
    .string()
    .trim()
    .max(24, "Phone number is too long.")
    .optional()
    .refine(
      (p) => !p || /^[+\d][\d\s\-()]{5,}$/.test(p),
      "Enter a valid phone number (digits, spaces, +, - allowed)."
    )
    .optional()
    .default(""),
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
      z
        .string()
        .trim()
        .min(1, "Subject name cannot be empty.")
        .max(80, "Subject name is too long.")
    )
    .min(1, "Select at least one subject.")
    .max(4, "You can select up to four subjects.")
    .refine((arr) => new Set(arr).size === arr.length, "Each subject may be selected once."),
  batch: z
    .string()
    .min(1, "Choose a batch.")
    .max(50, "Batch name is too long.")
    .trim(),
  plan: z.string().max(800, "Keep it under 800 characters.").trim().optional().default(""),
  paymentMethod: z
    .enum(["easypaisa", "jazzcash", "bank", "other"])
    .default("easypaisa"),
});

export const DemoBookingSchema = z.object({
  name: z.string().min(2, "Name is required.").max(80).trim(),
  email: z.email("Enter a valid email address.").max(120).trim(),
  phone: z
    .string()
    .trim()
    .min(6, "Enter a valid phone number.")
    .max(24, "Phone number is too long.")
    .regex(
      /^\+?[0-9][0-9\s\-()]{4,22}[0-9]$/,
      "Enter a valid phone number (digits, spaces, +, - allowed)."
    ),
  preferredDate: z.string().min(1, "Pick a preferred date.").max(20).trim(),
  preferredTime: z.string().min(1, "Pick a preferred time.").max(40).trim(),
  course: z
    .enum(["Spoken English", "IELTS Preparation", "PTE Preparation", "Duolingo English Test"])
    .or(z.string().min(1, "Choose a course.")),
  message: z.string().max(600, "Message too long.").trim().optional().default(""),
});

export const TestimonialSchema = z.object({
  name: z.string().min(2, "Name is required.").max(80).trim(),
  role: z.string().max(120, "Role is too long.").trim().default("Student"),
  quote: z.string().min(3, "Quote is required.").max(1200, "Quote too long.").trim(),
  outcome: z.string().max(120, "Outcome is too long.").trim().default(""),
  course: z.string().min(1, "Course is required.").max(80).trim(),
  featured: z.boolean().optional(),
  image: z
    .string()
    .max(400_000, "Image is too large.")
    .regex(/^data:image\/(?:webp|jpeg|png);base64,/, "Image must be a webp/jpeg/png data-URI.")
    .nullable()
    .optional(),
});

/** Max decoded size (bytes) for an uploaded registration receipt (10 MB). */
export const REGISTRATION_RECEIPT_MAX_BYTES = 10 * 1024 * 1024;
/** Max decoded size for the student photo (webp data-URI, ~640px). */
export const REGISTRATION_PHOTO_MAX_BYTES = 3 * 1024 * 1024;

const DATA_URI_RE = /^data:(image\/(?:png|jpeg|webp)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/;

/**
 * Strict upload validator used for the payment receipt. Accepts a PNG/JPEG/WebP
 * image or a PDF as a base64 data-URI, rejects anything else and enforces the
 * 10 MB decoded-size cap so oversized / foreign payloads never reach storage.
 */
export const ReceiptDataUriSchema = z
  .string()
  .regex(DATA_URI_RE, "Upload a receipt as PNG, JPEG, WebP or PDF.")
  .refine((uri) => {
    try {
      const b64 = uri.split(",")[1] ?? "";
      return Math.ceil((b64.length * 3) / 4) <= REGISTRATION_RECEIPT_MAX_BYTES;
    } catch {
      return false;
    }
  }, "Receipt must be under 10 MB.");

/** Strict validator for the student photo — image-only, capped at 3 MB. */
export const PhotoDataUriSchema = z
  .string()
  .regex(/^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/, "Photo must be a PNG, JPEG or WebP image.")
  .refine((uri) => {
    try {
      const b64 = uri.split(",")[1] ?? "";
      return Math.ceil((b64.length * 3) / 4) <= REGISTRATION_PHOTO_MAX_BYTES;
    } catch {
      return false;
    }
  }, "Photo must be under 3 MB.");

export const RegistrationSchema = z.object({
  courseKey: z.string().min(1, "Choose a course.").max(40).trim(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth."),
  phone: z
    .string()
    .trim()
    .min(6, "Enter a valid phone number.")
    .max(24, "Phone number is too long.")
    .regex(/^[+\d][\d\s\-()]{5,}$/, "Enter a valid phone number (digits, spaces, +, - allowed)."),
  address: z.string().min(5, "Enter your complete address.").max(300, "Address is too long.").trim(),
  education: z.object({
    qualification: z.string().min(2, "Enter your highest qualification.").max(120).trim(),
    institution: z.string().min(2, "Enter your institution.").max(160).trim(),
    yearOfPassing: z
      .string()
      .regex(/^\d{4}$/, "Enter a valid year (YYYY).")
      .refine((y) => {
        const yr = Number(y);
        return yr >= 1950 && yr <= new Date().getFullYear() + 1;
      }, "Enter a valid year."),
  }),
  study: z.object({
    preferredTime: z.string().min(1, "Pick your preferred study time.").max(40).trim(),
    focusModules: z
      .array(z.string().min(1).max(60).trim())
      .min(1, "Select at least one module.")
      .max(6, "Select up to six modules."),
    level: z.string().min(1, "Select your current level.").max(40).trim(),
    hoursPerWeek: z.string().min(1, "Select your study hours.").max(40).trim(),
    heardAbout: z.string().min(1, "Tell us how you heard about us.").max(60).trim(),
    extras: z.string().max(120, "Answer is too long.").trim().optional().nullable().default(null),
  }),
  payment: z.object({
    method: z.string().min(1, "Choose a payment method.").max(60).trim(),
    note: z.string().max(400, "Note is too long.").trim().optional().nullable().default(null),
    receipt: ReceiptDataUriSchema.optional().nullable().default(null),
    receiptName: z.string().max(120, "Filename is too long.").trim().optional().nullable().default(null),
  }),
  photo: PhotoDataUriSchema,
  agreed: z.literal(true, { error: "You must agree to the declaration to continue." }),
  sendCopy: z.boolean().optional().default(false),
});

export const TeamMemberSchema = z.object({
  name: z.string().min(2, "Name is required.").max(80).trim(),
  role: z.string().min(2, "Role is required.").max(120).trim(),
  headline: z.string().max(90, "Headline is too long.").trim().optional().nullable().default(null),
  credentials: z
    .array(z.string().max(120, "Credential is too long.").trim())
    .max(8, "Up to eight credentials.")
    .optional()
    .default([]),
  bio: z.string().min(10, "Bio needs at least 10 characters.").max(1400, "Bio too long.").trim(),
  focus: z
    .array(z.string().max(80, "Focus area is too long.").trim())
    .max(12, "Up to twelve focus areas.")
    .optional()
    .default([]),
  image: z
    .string()
    .max(400_000, "Image is too large.")
    .regex(/^data:image\/(?:webp|jpeg|png);base64,/, "Image must be a webp/jpeg/png data-URI.")
    .nullable()
    .optional(),
  order: z.number().int().min(0).max(999).optional().default(0),
  active: z.boolean().optional().default(true),
  ceo: z.boolean().optional().default(false),
});

export const FEEDBACK_CATEGORIES = [
  "courses",
  "teaching",
  "website",
  "billing",
  "suggestion",
  "general",
] as const;

export const FeedbackSchema = z.object({
  name: z.string().min(2, "Please tell us your name.").max(80).trim(),
  email: z
    .string()
    .max(120)
    .trim()
    .optional()
    .nullable()
    .default(null)
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email."),
  category: z.enum(FEEDBACK_CATEGORIES, { error: "Choose a category." }),
  rating: z.number().int().min(1, "Give us a rating (1–5 stars).").max(5),
  subject: z.string().min(3, "Add a short subject.").max(120).trim(),
  message: z.string().min(10, "Tell us a little more (at least 10 characters).").max(3000, "Keep it under 3000 characters.").trim(),
  contactOk: z.boolean().optional().default(false),
});

export function fieldErrors(result: { success: boolean; error?: z.ZodError }): Record<string, string[]> | null {
  if (!result.success && result.error) {
    return z.flattenError(result.error).fieldErrors as Record<string, string[]>;
  }
  return null;
}

/* ────────────────────────── Management & Communication ──────────────────── */

export const MgGroupSchema = z.object({
  name: z.string().min(2, "Group name is required.").max(80).trim(),
  courseId: z.string().max(80).trim().optional().nullable().default(null),
  courseName: z.string().max(120).trim().optional().nullable().default(null),
  teacherIds: z.array(z.string().max(40)).max(50).optional().default([]),
  studentIds: z.array(z.string().max(40)).max(5000).optional().default([]),
  schedule: z.string().max(120).trim().optional().nullable().default(null),
  notes: z.string().max(600).trim().optional().nullable().default(null),
});

export const MgAssignmentFields = {
  groupIds: z.array(z.string().min(1)).min(1, "Select at least one group.").max(100),
  title: z.string().min(2, "Title is required.").max(160).trim(),
  kind: z.enum(["homework", "assignment", "test", "quiz", "writing", "speaking", "reading", "listening", "general"]).optional().default("assignment"),
  description: z.string().max(2000).trim().optional().nullable().default(null),
  instructions: z.string().max(4000).trim().optional().nullable().default(null),
  links: z.array(z.string().max(500)).max(20).optional().default([]),
  materialIds: z.array(z.string().max(40)).max(40).optional().default([]),
  deadline: z.string().datetime({ offset: true }).optional().nullable().default(null),
  reminderEnabled: z.boolean().optional().default(false),
  reminderAt: z.string().datetime({ offset: true }).optional().nullable().default(null),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "OPEN", "CLOSED"]).optional().default("DRAFT"),
  scheduledFor: z.string().datetime({ offset: true }).optional().nullable().default(null),
  notifyOnPublish: z.boolean().optional().default(true),
};

export const MgAssignmentSchema = z.object(MgAssignmentFields);

export const MgSubmissionSchema = z.object({
  assignmentId: z.string().min(1),
  text: z.string().max(6000).trim().optional().nullable().default(null),
  links: z.array(z.string().max(500)).max(20).optional().default([]),
  attachments: z
    .array(
      z.object({
        name: z.string().max(120).trim(),
        mime: z.string().max(60).trim(),
        dataUri: z
          .string()
          .regex(/^data:[a-z]+\/[a-zA-Z0-9.+-]+;base64,/, "Invalid file.")
          .max(4_000_000, "File too large (max ~3 MB)."),
      })
    )
    .max(5, "Up to five files.")
    .optional()
    .default([]),
});

export const MgSubmissionReviewSchema = z.object({
  feedback: z.string().max(3000).trim().optional().nullable(),
  grade: z.string().max(80).trim().optional().nullable(),
  status: z.enum(["SUBMITTED", "LATE", "REVIEWED", "RETURNED"]).optional(),
});

export const MgAttendanceSchema = z.object({
  groupId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date."),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        name: z.string().max(80).trim(),
        status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
      })
    )
    .min(1)
    .max(5000),
});

export const MgMaterialSchema = z.object({
  title: z.string().min(2, "Title is required.").max(160).trim(),
  category: z.string().max(80).trim().optional().nullable().default(null),
  description: z.string().max(1000).trim().optional().nullable().default(null),
  type: z.enum(["PDF", "DOC", "IMAGE", "VIDEO", "LINK"]),
  url: z.string().max(2000).trim().optional().nullable().default(null),
  groupId: z.string().max(40).trim().optional().nullable().default(null),
  courseId: z.string().max(80).trim().optional().nullable().default(null),
  dataUri: z
    .string()
    .regex(/^data:image\/(?:webp|png|jpeg);base64,/, "Material image must be webp/png/jpeg.")
    .max(400_000)
    .optional()
    .nullable()
    .default(null),
});

export const MgTemplateSchema = z.object({
  name: z.string().min(2, "Template name is required.").max(60).trim(),
  body: z.string().min(3, "Template body is required.").max(1500).trim(),
  active: z.boolean().optional().default(true),
});

export const MgMessageSchema = z.object({
  kind: z.enum(["assignment", "announcement", "reminder", "material", "notice", "custom"]),
  recipientType: z.enum(["student", "group", "groups"]),
  studentIds: z.array(z.string().max(40)).max(200).optional().default([]),
  groupIds: z.array(z.string().max(40)).max(50).optional().default([]),
  text: z.string().min(2, "Message is required.").max(4000).trim(),
  scheduleAt: z.string().datetime({ offset: true }).optional().nullable().default(null),
});

export const MgStudentCreateSchema = z.object({
  email: z.email("Valid email required.").max(120).trim(),
  name: z.string().min(2, "Name is required.").max(80).trim(),
  phone: z.string().max(24).trim().optional().nullable().default(null),
  groupIds: z.array(z.string().max(40)).max(100).optional().default([]),
  courseName: z.string().max(120).trim().optional().nullable().default(null),
  notes: z.string().max(600).trim().optional().nullable().default(null),
});

export const MgTeacherCreateSchema = z.object({
  email: z.email("Valid email required.").max(120).trim(),
  name: z.string().min(2, "Name is required.").max(80).trim(),
  phone: z.string().max(24).trim().optional().nullable().default(null),
  courseIds: z.array(z.string().max(80)).max(50).optional().default([]),
});