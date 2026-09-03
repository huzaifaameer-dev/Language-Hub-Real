import { MongoClient } from "mongodb";
import type { Db } from "mongodb";
import bcrypt from "bcryptjs";
import type { CourseInfo } from "@/lib/course-data";
import { FALLBACK_COURSES } from "@/lib/course-data";
import { TESTIMONIALS } from "@/lib/content";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB ?? "languagehub";

/**
 * Bump when the admin seed shape/password handling changes so stored admins
 * get re-hashed with the current ADMIN_PASSWORD on the next ensure call.
 */
const SEED_VERSION = 3;

declare global {
  var lhMongo: Promise<MongoClient> | undefined;
}

export function createDbClient(): Promise<MongoClient> {
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  return client.connect();
}

export const clientPromise: Promise<MongoClient> =
  globalThis.lhMongo ?? createDbClient();

// Mark the original promise handled so a transiently-unreachable database can
// never surface as an unhandled-rejection crash (callers still see the error
// when they await getDb).
clientPromise.catch(() => {});

if (process.env.NODE_ENV !== "production") {
  globalThis.lhMongo = clientPromise;
}

export function getDb(): Promise<Db> {
  return clientPromise.then((c) => c.db(dbName));
}

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

/** How a manually-recorded payment/withdrawal entered the ledger. */
export type PaymentLedgerType = "DEPOSIT" | "WITHDRAWAL";
export type ManualPaymentMethod = "card" | "easypaisa" | "jazzcash" | "bank" | "cash";

export interface PaymentDoc {
  _id?: unknown;
  enrollmentId: string;
  userId: string;
  amount: number;
  currency: string;
  /** "manual" for screenshot flow / admin-recorded, "card"/"stripe" for online checkout, "konnect" for EasyPaisa/JazzCash. */
  provider: "manual" | "stripe" | "konnect";
  /** Stripe PaymentIntent / Session id when online. */
  providerRef?: string | null;
  /** Stripe PaymentIntent id (set once the webhook confirms the session). */
  paymentIntentId?: string | null;
  /** True when the charge was actually refunded through Stripe (not just marked). */
  refundedRef?: string | null;
  status: PaymentStatus;
  /** DEPOSIT (money in) vs WITHDRAWAL (money out). Defaults to DEPOSIT. */
  type?: PaymentLedgerType;
  /** How a manual record was settled (card/easypaisa/jazzcash/bank/cash). */
  method?: ManualPaymentMethod | null;
  /** Optional admin note attached to a manual record. */
  note?: string | null;
  /** Free-text payer/bank name for manual records without an enrollment. */
  studentName?: string | null;
  studentEmail?: string | null;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getPaymentsCollection() {
  const db = await getDb();
  return db.collection<PaymentDoc>("payments");
}

export type DemoBookingStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export interface TestimonialDoc {
  _id?: unknown;
  name: string;
  role: string;
  quote: string;
  outcome: string;
  course: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getTestimonialsCollection() {
  const db = await getDb();
  return db.collection<TestimonialDoc>("testimonials");
}

export interface DemoBookingDoc {
  _id?: unknown;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  course: string;
  message?: string | null;
  status: DemoBookingStatus;
  adminMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getDemoBookingsCollection() {
  const db = await getDb();
  return db.collection<DemoBookingDoc>("demo_bookings");
}

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ApplicationDoc {
  _id?: unknown;
  userId: string;
  name: string;
  email: string;
  place: string;
  bio: string;
  course: string;
  message?: string;
  status: ApplicationStatus;
  adminMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const COURSE_LIST = [
  "Spoken English",
  "IELTS Preparation",
  "PTE Preparation",
  "Duolingo English Test",
] as const;

export type Course = string;

export type EnrollmentStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "PROOF_SUBMITTED"
  | "ENROLLED"
  | "REJECTED";

export type PaymentMethod = "easypaisa" | "jazzcash" | "bank" | "other" | "card";

export const ENROLLMENT_ACTIVE_STATUSES: EnrollmentStatus[] = [
  "PENDING",
  "AWAITING_PAYMENT",
  "PROOF_SUBMITTED",
];

export interface EnrollmentDoc {
  _id?: unknown;
  userId: string;
  applicationId: string;
  name: string;
  email: string;
  subjects: Course[];
  batch: string;
  plan?: string;
  /** How the student intends to pay (set at request time). */
  paymentMethod?: PaymentMethod | null;
  /** Admin-issued payment instructions (number + amount) shown to the student. */
  paymentInstructions?: string | null;
  /** Relative path to the student's uploaded payment-proof screenshot. */
  paymentProof?: string | null;
  status: EnrollmentStatus;
  adminMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getApplicationsCollection() {
  const db = await getDb();
  return db.collection<ApplicationDoc>("applications");
}

export async function getEnrollmentsCollection() {
  const db = await getDb();
  return db.collection<EnrollmentDoc>("enrollments");
}

export async function getUsersCollection() {
  const db = await getDb();
  return db.collection("users");
}

export interface CourseDoc extends CourseInfo {
  _id?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export async function getCoursesCollection() {
  const db = await getDb();
  return db.collection<CourseDoc>("courses");
}

export interface NotificationDoc {
  _id?: unknown;
  userId: string;
  kind: string;
  title: string;
  message?: string | null;
  href?: string | null;
  read: boolean;
  createdAt: Date;
}

export interface AuthTokenDoc {
  _id?: unknown;
  userId: string;
  token: string;
  purpose: "password-reset" | "email-verify";
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date | null;
}

export interface SettingsDoc {
  _id?: unknown;
  key: string;
  value: unknown;
  updatedAt: Date;
}

export interface BlogPostDoc {
  _id?: unknown;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  author: string;
  tags: string[];
  published: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date | null;
}

/** Immutable admin action log entry (audit trail). */
export interface AuditLogDoc {
  _id?: unknown;
  actor: string;
  action: string;
  targetType: string;
  targetLabel?: string;
  detail?: string;
  createdAt: Date;
}

export async function getAuditLogCollection() {
  const db = await getDb();
  return db.collection<AuditLogDoc>("audit_log");
}

/** Record an admin action (fire-and-forget). Used by admin mutation routes. */
export async function logAdminAction(input: {
  actor: string;
  action: string;
  targetType: string;
  targetLabel?: string;
  detail?: string;
}): Promise<void> {
  try {
    const col = await getAuditLogCollection();
    await col.insertOne({ ...input, createdAt: new Date() });
  } catch {
    // Audit logging is best-effort — never fail an admin mutation on a log write.
  }
}

export async function getBlogCollection() {
  const db = await getDb();
  return db.collection<BlogPostDoc>("blog_posts");
}

export async function getNotificationsCollection() {
  const db = await getDb();
  return db.collection<NotificationDoc>("notifications");
}

export async function getAuthTokensCollection() {
  const db = await getDb();
  return db.collection<AuthTokenDoc>("auth_tokens");
}

export async function getSettingsCollection() {
  const db = await getDb();
  return db.collection<SettingsDoc>("settings");
}

/**
 * Ensures indexes + the admin account exist.
 *
 * Runs once per server process (lazy singleton). Idempotent and safe to call
 * from any request; after the first success it short-circuits so hot paths
 * stop paying the Mongo round-trip. A failure clears the promise so the next
 * request retries.
 */
let initPromise: Promise<void> | null = null;

export function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await getDb();

      await Promise.all([
        db.collection("users").createIndex({ email: 1 }, { unique: true }),
        db.collection("users").createIndex({ role: 1 }),
        db.collection("applications").createIndex({ userId: 1 }),
        db.collection("applications").createIndex({ status: 1 }),
        db.collection("applications").createIndex({ email: 1 }),
        db.collection("applications").createIndex({ createdAt: -1 }),
        db.collection("enrollments").createIndex({ userId: 1 }),
        db.collection("enrollments").createIndex({ status: 1 }),
        db.collection("enrollments").createIndex({ applicationId: 1 }),
        db.collection("enrollments").createIndex({ createdAt: -1 }),
        db.collection("demo_bookings").createIndex({ status: 1 }),
        db.collection("demo_bookings").createIndex({ createdAt: -1 }),
        db.collection("demo_bookings").createIndex({ email: 1 }),
        db.collection("testimonials").createIndex({ active: 1, order: 1 }),
        db.collection("payments").createIndex({ userId: 1 }),
        db.collection("payments").createIndex({ enrollmentId: 1 }),
        db.collection("payments").createIndex({ providerRef: 1 }, { unique: true, sparse: true }),
        db.collection("payments").createIndex({ status: 1, createdAt: -1 }),
        db.collection("notifications").createIndex({ userId: 1, read: 1 }),
        db.collection("notifications").createIndex({ userId: 1, createdAt: -1 }),
        db.collection("auth_tokens").createIndex({ token: 1 }, { unique: true }),
        db.collection("auth_tokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        db.collection("courses").createIndex({ name: 1 }, { unique: true }),
        db.collection("courses").createIndex({ active: 1, order: 1 }),
        db.collection("blog_posts").createIndex({ slug: 1 }, { unique: true }),
        db.collection("blog_posts").createIndex({ published: 1, publishedAt: -1 }),
        db.collection("blog_posts").createIndex({ tags: 1 }),
        db.collection("settings").createIndex({ key: 1 }, { unique: true }),
        db.collection("errors").createIndex({ createdAt: -1 }),
        db.collection("audit_log").createIndex({ createdAt: -1 }),
        db.collection("audit_log").createIndex({ actor: 1, createdAt: -1 }),
        db.collection("ratelimits").createIndex({ resetAt: 1 }, { expireAfterSeconds: 1 }),
        db.collection("placement_test_leads").createIndex({ createdAt: -1 }),
        db.collection("placement_test_leads").createIndex({ email: 1 }),
        db.collection("student_progress").createIndex({ userId: 1, enrollmentId: 1 }, { unique: true }),
        db.collection("student_progress").createIndex({ userId: 1 }),
        db.collection("live_classes").createIndex({ userId: 1, scheduledAt: 1 }),
        db.collection("live_classes").createIndex({ enrollmentId: 1 }),
        db.collection("certificates").createIndex({ userId: 1 }),
        db.collection("certificates").createIndex({ certificateId: 1 }, { unique: true }),
        db.collection("certificates").createIndex({ enrollmentId: 1 }),
        db.collection("assignments").createIndex({ userId: 1, course: 1 }),
        db.collection("assignments").createIndex({ enrollmentId: 1 }),
        db.collection("assignments").createIndex({ createdAt: -1 }),
        db.collection("whatsapp_leads").createIndex({ createdAt: -1 }),
        db.collection("whatsapp_leads").createIndex({ phone: 1 }),
        db.collection("referrals").createIndex({ userId: 1 }, { unique: true }),
        db.collection("referrals").createIndex({ code: 1 }, { unique: true }),
        db.collection("referral_redeems").createIndex({ referralCode: 1 }),
        db.collection("referral_redeems").createIndex({ redeemedAt: -1 }),
        db.collection("automation_sends").createIndex({ key: 1 }, { unique: true }),
        db.collection("automation_sends").createIndex({ sentAt: -1 }),
      ]);

      // Drop legacy redundant indexes from older schema versions (best-effort;
      // on fresh databases the drop is a no-op that resolves to "not found").
      await Promise.all([
        db.collection("notifications").dropIndex("userId_1").catch(() => {}),
        db.collection("auth_tokens").dropIndex("token_1_purpose_1").catch(() => {}),
      ]);

      // Seed the course catalog (idempotent per course name).
      const courses = db.collection<CourseDoc>("courses");
      const now = new Date();
      await Promise.all(
        FALLBACK_COURSES.map((c) =>
          courses.updateOne(
            { name: c.name },
            {
              $setOnInsert: {
                ...c,
                createdAt: now,
                updatedAt: now,
              },
            },
            { upsert: true }
          )
        )
      );

      // Seed default testimonials (idempotent per quote).
      const testimonials = db.collection<TestimonialDoc>("testimonials");
      await Promise.all(
        TESTIMONIALS.map((t, i) =>
          testimonials.updateOne(
            { quote: t.quote },
            {
              $setOnInsert: {
                name: t.name,
                role: t.role,
                quote: t.quote,
                outcome: t.outcome,
                course: t.course,
                active: true,
                order: i,
                createdAt: now,
                updatedAt: now,
              },
            },
            { upsert: true }
          )
        )
      );

      if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
        const existing = await db
          .collection("users")
          .findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });

        if (existing) {
          // Re-apply the CURRENT ADMIN_PASSWORD whenever the stored doc predates
          // the current seed format (hash drift / secret rotation). One-time per
          // seedVersion bump; bcrypt cost stays off the hot path.
          const version = (existing as { seedVersion?: number }).seedVersion;
          if (version !== SEED_VERSION) {
            const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
            await db
              .collection("users")
              .updateOne(
                { _id: existing._id },
                { $set: { password: hash, role: "ADMIN", seedVersion: SEED_VERSION } }
              );
          }
        } else {
          const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
          await db.collection("users").insertOne({
            name: "Administrator",
            email: process.env.ADMIN_EMAIL.toLowerCase(),
            password: hash,
            role: "ADMIN",
            seedVersion: SEED_VERSION,
            emailVerified: null,
            image: null,
            createdAt: new Date(),
          });
        }
      }

      // Migrate payment-proof screenshots from the old /public/uploads/proof
      // location to the private dir, and rewrite stored paths to the
      // auth-guarded /api/proof/:id endpoint. Proofs must never be public.
      try {
        const { mkdir, readdir, copyFile, unlink } = await import("node:fs/promises");
        const path = await import("node:path");
        const srcDir = path.join(process.cwd(), "public", "uploads", "proof");
        const dstDir = path.join(process.cwd(), "private", "uploads", "proof");
        await mkdir(dstDir, { recursive: true });
        const moved = new Set<string>();
        try {
          const files = await readdir(srcDir);
          for (const f of files) {
            const id = f.replace(/\.webp$/i, "");
            await copyFile(path.join(srcDir, f), path.join(dstDir, id + ".webp")).catch(() => {});
            await unlink(path.join(srcDir, f)).catch(() => {});
            moved.add(id);
          }
        } catch {
          // src dir may not exist yet — fine.
        }
        if (moved.size > 0) {
          await db
            .collection("enrollments")
            .updateMany(
              { paymentProof: { $regex: "^/uploads/proof/" } },
              [{ $set: { paymentProof: { $concat: ["/api/proof/", { $toString: "$_id" }] } } }]
            )
            .catch(() => {});
        }
      } catch {
        // migration is best-effort; never block server boot on it
      }
    })().catch((err) => {
      initPromise = null; // allow retry on the next request
      throw err;
    });
  }
  return initPromise;
}

/** Backwards-compatible alias (older modules). */
export const ensureIndexesAndAdmin = ensureInit;

/* ------------------------------------------------------------------ */
/*  Feature 5–8: Student progress, live classes, certificates,        */
/*  assignments                                                        */
/* ------------------------------------------------------------------ */

/** Per-chapter completion + attendance record for a student. */
export interface StudentProgressDoc {
  _id?: unknown;
  userId: string;
  enrollmentId: string;
  /** Course name this progress belongs to */
  course: string;
  /** Map of chapter/module title → completion status */
  chapters: Array<{
    title: string;
    completed: boolean;
    completedAt?: Date | null;
  }>;
  /** Attendance records: array of class dates + attended flag */
  attendance: Array<{
    date: string;
    attended: boolean;
    topic?: string;
  }>;
  /** Last opened chapter (for "continue learning") */
  lastChapter?: string | null;
  updatedAt: Date;
  createdAt: Date;
}

export async function getStudentProgressCollection() {
  const db = await getDb();
  return db.collection<StudentProgressDoc>("student_progress");
}

/** Live class schedule entry. */
export interface LiveClassDoc {
  _id?: unknown;
  enrollmentId: string;
  userId: string;
  course: string;
  batch: string;
  /** Class title/topic */
  title: string;
  /** ISO date string */
  scheduledAt: string;
  /** Duration in minutes */
  durationMinutes: number;
  /** Zoom / Google Meet / etc link */
  meetingLink: string;
  /** Platform label (Zoom, Google Meet, etc) */
  platform: string;
  /** Instructor name */
  instructor: string;
  createdAt: Date;
}

export async function getLiveClassesCollection() {
  const db = await getDb();
  return db.collection<LiveClassDoc>("live_classes");
}

/** Digital certificate issued to a student on course completion. */
export interface CertificateDoc {
  _id?: unknown;
  userId: string;
  enrollmentId: string;
  studentName: string;
  course: string;
  batch: string;
  /** ISO date string */
  issuedAt: string;
  /** Completion percentage at time of issue */
  completionPercent: number;
  /** Instructor who signed off */
  signedBy: string;
  /** Unique certificate ID (public-facing) */
  certificateId: string;
  createdAt: Date;
}

export async function getCertificatesCollection() {
  const db = await getDb();
  return db.collection<CertificateDoc>("certificates");
}

/** Assignment submission + teacher feedback thread. */
export interface AssignmentDoc {
  _id?: unknown;
  userId: string;
  enrollmentId: string;
  course: string;
  /** Assignment title */
  title: string;
  /** Description / prompt */
  description: string;
  /** Student's submitted text answer */
  studentAnswer?: string;
  /** URL or path to uploaded file (if any) */
  attachmentUrl?: string | null;
  /** Submission status */
  status: "DRAFT" | "SUBMITTED" | "GRADED";
  /** Grade or score (set by teacher) */
  grade?: string | null;
  /** Feedback thread: array of messages between student and teacher */
  feedbackThread: Array<{
    sender: "student" | "teacher";
    message: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export async function getAssignmentsCollection() {
  const db = await getDb();
  return db.collection<AssignmentDoc>("assignments");
}

/* ------------------------------------------------------------------ */
/*  Feature 18: Referral program                                       */
/* ------------------------------------------------------------------ */

export interface ReferralDoc {
  _id?: unknown;
  /** The user who owns this referral code. */
  userId: string;
  /** Unique discount code, e.g. FRIEND-ABC123. */
  code: string;
  /** Discount percent (e.g. 10). */
  discountPercent: number;
  /** How many times the code has been redeemed. */
  redemptions: number;
  createdAt: Date;
}

export interface ReferralRedeemDoc {
  _id?: unknown;
  referralCode: string;
  ownerUserId: string;
  /** The new user who redeemed it (optional, may be a lead before signup). */
  redeemedByEmail?: string | null;
  redeemedByUserId?: string | null;
  redeemedAt: Date;
}

export async function getReferralsCollection() {
  const db = await getDb();
  return db.collection<ReferralDoc>("referrals");
}

export async function getReferralRedeemsCollection() {
  const db = await getDb();
  return db.collection<ReferralRedeemDoc>("referral_redeems");
}

/** Generate a unique shareable referral code for a user. */
export function generateReferralCode(userId: string, name?: string): string {
  const prefix = (name || "FRIEND")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 4)
    .toUpperCase() || "LH";
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${userId.slice(-4).toUpperCase()}${rand}`.slice(0, 16);
}