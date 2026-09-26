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
const SEED_VERSION = 4;

declare global {
  var lhMongo: Promise<MongoClient> | undefined;
}

export function createDbClient(): Promise<MongoClient> {
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 1,
    // Longer than default so Atlas free-tier cold/sleep starts (or slow Vercel
    // cold boxes) don't fail the first request — the connection is reused from
    // globalThis on warm instances.
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 60000,
    retryReads: true,
    retryWrites: true,
  });
  return client.connect();
}

export const clientPromise: Promise<MongoClient> =
  globalThis.lhMongo ?? createDbClient();

// Mark the original promise handled so a transiently-unreachable database can
// never surface as an unhandled-rejection crash (callers still see the error
// when they await getDb).
clientPromise.catch(() => {
  // A rejected connection must not poison every later request: reset the cache
  // so the next call attempts a fresh client instead of reusing a dead one.
  globalThis.lhMongo = undefined;
});

// Cache on globalThis in ALL environments (not just dev). On serverless the
// instance dies between requests, but while it is warm the same client is
// reused — this is what makes the connection survive across requests in prod.
globalThis.lhMongo = clientPromise;

/** Lazy cached connection that self-heals: if the cached client was rejected,
 *  a fresh one is created before the next query so a stale failure does not
 *  permanently brick the serverless instance. */
export function getClient(): Promise<MongoClient> {
  const cached = globalThis.lhMongo;
  if (cached) return cached;
  const fresh = createDbClient();
  fresh.catch(() => {
    globalThis.lhMongo = undefined;
  });
  globalThis.lhMongo = fresh;
  return fresh;
}

export function getDb(): Promise<Db> {
  return getClient().then((c) => c.db(dbName));
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
  /** Featured "top band scorer" review — displayed as a premium hero card. */
  featured?: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getTestimonialsCollection() {
  const db = await getDb();
  return db.collection<TestimonialDoc>("testimonials");
}

/* ── Team members (admin-managed profiles shown on /team) ── */

export interface TeamMemberDoc {
  _id?: unknown;
  /** Display name, e.g. "Javaria Malik". */
  name: string;
  /** Full role line, e.g. "CEO · Founder · Chairman". */
  role: string;
  /** Short badge text for the CEO flagship block, e.g. "MS. JAVARIA MALIK". */
  headline?: string | null;
  credentials: string[];
  bio: string;
  focus: string[];
  /** Data-URI (webp/jpeg/png) portrait. */
  image?: string | null;
  order: number;
  active: boolean;
  /** The flagship founder/CEO profile — rendered as a special featured block. */
  ceo?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function getTeamMembersCollection() {
  const db = await getDb();
  return db.collection<TeamMemberDoc>("team_members");
}

/* ── Feedback (site/dashboard submissions reviewed in the admin panel) ── */

export type FeedbackCategory =
  | "courses"
  | "teaching"
  | "website"
  | "billing"
  | "suggestion"
  | "general";

export type FeedbackStatus = "NEW" | "REVIEWED" | "ARCHIVED";

export interface FeedbackDoc {
  _id?: unknown;
  /** Submitter display name. */
  name: string;
  email?: string | null;
  /** Signed-in user id, when the visitor was authenticated. */
  userId?: string | null;
  category: FeedbackCategory;
  /** 1–5 star rating. */
  rating: number;
  subject: string;
  message: string;
  contactOk: boolean;
  status: FeedbackStatus;
  /** Optional admin reply note (shown back if ever surfaced). */
  adminNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getFeedbackCollection() {
  const db = await getDb();
  return db.collection<FeedbackDoc>("feedback");
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Management & Communication System (groups, assignments, attendance,       */
/*  materials, messages — used by /manage and /my-learning)                  */
/* ────────────────────────────────────────────────────────────────────────── */

export interface GroupDoc {
  _id?: unknown;
  /** e.g. "Spoken English Morning", "IELTS Batch A" (never hard-coded). */
  name: string;
  courseId?: string | null;
  courseName?: string | null;
  /** Teacher user-ids assigned to this group. */
  teacherIds: string[];
  /** Student user-ids in this group (users can be in many groups). */
  studentIds: string[];
  schedule?: string | null;
  notes?: string | null;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: Date;
  updatedAt: Date;
}

export interface TeacherDoc {
  _id?: unknown;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  courseIds: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type MgAssignmentStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "OPEN" | "CLOSED";
export type MgAssignmentPriority = "LOW" | "MEDIUM" | "HIGH";
export type MgAssignmentKind = "homework" | "assignment" | "test" | "quiz" | "writing" | "speaking" | "reading" | "listening" | "general";

export interface MgAssignmentDoc {
  _id?: unknown;
  groupIds: string[];
  teacherId: string;
  teacherName: string;
  courseId?: string | null;
  courseName?: string | null;
  title: string;
  kind?: MgAssignmentKind | null;
  description?: string | null;
  instructions?: string | null;
  attachments: Array<{ name: string; rel: string; mime: string }>;
  links: string[];
  materialIds: string[];
  deadline?: Date | null;
  reminderEnabled: boolean;
  /** When the automatic reminder to non-submitters fires (default: 2h before deadline). */
  reminderAt?: Date | null;
  priority: MgAssignmentPriority;
  status: MgAssignmentStatus;
  /** For SCHEDULED: when to auto-publish. */
  scheduledFor?: Date | null;
  notifyOnPublish: boolean;
  publishedAt?: Date | null;
  closedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SubmissionStatus = "SUBMITTED" | "LATE" | "REVIEWED" | "RETURNED";

export interface SubmissionDoc {
  _id?: unknown;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string | null;
  text?: string | null;
  links: string[];
  attachments: Array<{ name: string; rel: string; mime: string }>;
  status: SubmissionStatus;
  feedback?: string | null;
  grade?: string | null;
  submittedAt: Date;
  reviewedAt?: Date | null;
  returnedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface AttendanceRecord {
  studentId: string;
  name: string;
  status: AttendanceStatus;
}

export interface AttendanceDoc {
  _id?: unknown;
  groupId: string;
  /** YYYY-MM-DD */
  date: string;
  records: AttendanceRecord[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MaterialType = "PDF" | "DOC" | "IMAGE" | "VIDEO" | "LINK";

export interface MaterialDoc {
  _id?: unknown;
  title: string;
  category?: string | null;
  description?: string | null;
  type: MaterialType;
  /** External link OR tenant-relative private path for uploaded files. */
  url?: string | null;
  uploaderId: string;
  uploaderName: string;
  groupId?: string | null;
  courseId?: string | null;
  active: boolean;
  createdAt: Date;
}

export type MessageStatus = "DRAFT" | "SCHEDULED" | "PROCESSING" | "SENT" | "FAILED" | "CANCELLED";
export type MessageKind =
  | "assignment"
  | "announcement"
  | "reminder"
  | "material"
  | "notice"
  | "custom";

export interface MessageDelivery {
  phone: string;
  name: string;
  status: "SENT" | "FAILED" | "PENDING" | "READ" | "DELIVERED";
  messageId?: string | null;
  error?: string | null;
}

export interface MessageDoc {
  _id?: unknown;
  /** Dedupe key for reminders ("remind:<assignmentId>:<studentId>"). */
  refKey?: string | null;
  kind: MessageKind;
  senderId: string;
  senderName: string;
  recipientType: "student" | "group" | "groups";
  studentIds: string[];
  groupIds: string[];
  groupNames: string[];
  text: string;
  templateKey?: string | null;
  variables?: Record<string, string> | null;
  status: MessageStatus;
  scheduledFor?: Date | null;
  sentAt?: Date | null;
  failedReason?: string | null;
  /** True when simulated (WhatsApp API not configured). */
  mock: boolean;
  relatedAssignmentId?: string | null;
  deliveries: MessageDelivery[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTemplateDoc {
  _id?: unknown;
  name: string;
  body: string;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getGroupsCollection() {
  const db = await getDb();
  return db.collection<GroupDoc>("groups");
}

export async function getTeachersCollection() {
  const db = await getDb();
  return db.collection<TeacherDoc>("teachers");
}

export async function getMgAssignmentsCollection() {
  const db = await getDb();
  return db.collection<MgAssignmentDoc>("assignments");
}

export async function getSubmissionsCollection() {
  const db = await getDb();
  return db.collection<SubmissionDoc>("submissions");
}

export async function getAttendanceCollection() {
  const db = await getDb();
  return db.collection<AttendanceDoc>("attendance");
}

export async function getMaterialsCollection() {
  const db = await getDb();
  return db.collection<MaterialDoc>("materials");
}

export async function getMessagesCollection() {
  const db = await getDb();
  return db.collection<MessageDoc>("messages");
}

export async function getMessageTemplatesCollection() {
  const db = await getDb();
  return db.collection<MessageTemplateDoc>("message_templates");
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
  authorRole?: "ceo" | "founder" | "teacher" | "developer" | "manager" | "ambassador";
  tags: string[];
  published: boolean;
  views: number;
  commentCount: number;
  likeCount: number;
  interestedCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date | null;
}

/** A Daily News post authored from the admin panel. */
export interface NewsPostDoc {
  _id?: unknown;
  slug: string;
  title: string;
  body: string;
  coverImage?: string | null;
  authorName: string;
  authorRole: "ceo" | "founder" | "teacher" | "developer" | "manager" | "ambassador";
  tags: string[];
  published: boolean;
  pinned: boolean;
  views: number;
  likeCount: number;
  interestedCount: number;
  notInterestedCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date | null;
}

/** A single comment a visitor/student leaves on a news (blog) post. */
export interface NewsCommentDoc {
  _id?: unknown;
  postSlug: string;
  postTitle?: string;
  /** Display name (always captured, even for anonymous visitors). */
  authorName: string;
  /** Signed-in user id when available (for avatar + future mentions). */
  authorId?: string | null;
  authorImage?: string | null;
  /** Anonymous identity cookie, used for like-vote dedupe + rate limiting. */
  clientId?: string | null;
  text: string;
  likes: number;
  /** Actor ids (userId or clientId) that already liked this comment. */
  likedBy: string[];
  /** Admin officially endorsed this comment (badge shown to visitors). */
  adminLiked: boolean;
  pinned: boolean;
  hidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** One row per (post, actor) storing that actor's reaction to a news post. */
export interface NewsReactionDoc {
  _id?: unknown;
  postSlug: string;
  /** userId or anonymous clientId. */
  actorId: string;
  type: "like" | "interested" | "not_interested";
  updatedAt: Date;
}

/* ── Course Registration (replaces the old apply → approve flow) ── */

export type RegistrationStatus = "NEW" | "CONTACTED" | "ENROLLED";

export interface RegistrationEducation {
  qualification: string;
  institution: string;
  yearOfPassing: string;
}

export interface RegistrationStudyPrefs {
  preferredTime: string;
  focusModules: string[];
  level: string;
  hoursPerWeek: string;
  heardAbout: string;
  /** Course-specific answer, e.g. the extra test/goal question. */
  extras?: string | null;
}

export interface RegistrationPayment {
  method: string;
  note?: string | null;
  /** Tenant-relative path to the uploaded receipt (image or PDF). */
  receipt?: string | null;
  /** Original filename of the uploaded receipt, for the admin panel. */
  receiptName?: string | null;
}

export interface RegistrationDoc {
  _id?: unknown;
  /** Human-friendly reference, e.g. LH-2026-9X2K4Q. */
  ref: string;
  userId: string;
  /** Student display name captured at sign-up (authoritative). */
  name: string;
  email: string;
  /** Course key — see lib/registration-config.ts. */
  courseKey: string;
  /** Public course name snapshot. */
  course: string;
  dob: string;
  phone: string;
  address: string;
  education: RegistrationEducation;
  study: RegistrationStudyPrefs;
  payment: RegistrationPayment;
  /** Tenant-relative path to the student photo (auth-guarded). */
  photo?: string | null;
  /** True once the declaration checkbox was accepted. */
  agreed: boolean;
  /** Student asked for an emailed copy of their responses. */
  sendCopy: boolean;
  /** Admin tracked. */
  status: RegistrationStatus;
  /** Optional note the admin attached while contacting/enrolling. */
  adminMessage?: string | null;
  /** Tenant-relative path to the generated PDF summary. */
  pdfPath?: string | null;
  pdfAttached: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export async function getNewsPostsCollection() {
  const db = await getDb();
  return db.collection<NewsPostDoc>("news_posts");
}

export async function getRegistrationsCollection() {
  const db = await getDb();
  return db.collection<RegistrationDoc>("registrations");
}

export async function getNewsCommentsCollection() {
  const db = await getDb();
  return db.collection<NewsCommentDoc>("news_comments");
}

export async function getNewsReactionsCollection() {
  const db = await getDb();
  return db.collection<NewsReactionDoc>("news_reactions");
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
        db.collection("team_members").createIndex({ active: 1, order: 1 }),
        db.collection("team_members").createIndex({ ceo: 1 }),
        db.collection("feedback").createIndex({ status: 1, createdAt: -1 }),
        db.collection("feedback").createIndex({ createdAt: -1 }),
        db.collection("groups").createIndex({ name: 1 }),
        db.collection("groups").createIndex({ teacherIds: 1, status: 1 }),
        db.collection("groups").createIndex({ studentIds: 1, status: 1 }),
        db.collection("teachers").createIndex({ userId: 1 }, { unique: true }),
        db.collection("assignments").createIndex({ groupIds: 1, createdAt: -1 }),
        db.collection("assignments").createIndex({ status: 1, scheduledFor: 1 }),
        db.collection("assignments").createIndex({ teacherId: 1, createdAt: -1 }),
        db.collection("assignments").createIndex({ deadline: 1, reminderAt: 1 }),
        db.collection("submissions").createIndex({ assignmentId: 1, studentId: 1 }, { unique: true }),
        db.collection("submissions").createIndex({ assignmentId: 1, status: 1 }),
        db.collection("submissions").createIndex({ studentId: 1, createdAt: -1 }),
        db.collection("attendance").createIndex({ groupId: 1, date: 1 }, { unique: true }),
        db.collection("attendance").createIndex({ date: 1 }),
        db.collection("materials").createIndex({ createdAt: -1 }),
        db.collection("materials").createIndex({ groupId: 1 }),
        db.collection("messages").createIndex({ status: 1, scheduledFor: 1 }),
        db.collection("messages").createIndex({ senderId: 1, createdAt: -1 }),
        db.collection("messages").createIndex({ groupIds: 1, createdAt: -1 }),
        db.collection("messages").createIndex({ refKey: 1 }, { unique: true, sparse: true }),
        db.collection("message_templates").createIndex({ name: 1 }, { unique: true }),
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
        db.collection("news_comments").createIndex({ postSlug: 1, createdAt: -1 }),
        db.collection("news_comments").createIndex({ pinned: 1, createdAt: -1 }),
        db.collection("news_comments").createIndex({ hidden: 1 }),
        db.collection("news_reactions").createIndex({ postSlug: 1, actorId: 1 }, { unique: true }),
        db.collection("news_reactions").createIndex({ postSlug: 1, type: 1, createdAt: -1 }),
        db.collection("news_posts").createIndex({ slug: 1 }, { unique: true }),
        db.collection("news_posts").createIndex({ published: 1, pinned: -1, publishedAt: -1 }),
        db.collection("news_posts").createIndex({ tags: 1 }),
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
        db.collection("registrations").createIndex({ userId: 1, createdAt: -1 }),
        db.collection("registrations").createIndex({ status: 1, createdAt: -1 }),
        db.collection("registrations").createIndex({ ref: 1 }, { unique: true }),
        db.collection("registrations").createIndex({ courseKey: 1, createdAt: -1 }),
        db.collection("whatsapp_leads").createIndex({ createdAt: -1 }),
        db.collection("whatsapp_leads").createIndex({ phone: 1 }),
        db.collection("referrals").createIndex({ userId: 1 }, { unique: true }),
        db.collection("referrals").createIndex({ code: 1 }, { unique: true }),
        db.collection("referral_redeems").createIndex({ referralCode: 1 }),
        db.collection("referral_redeems").createIndex({ redeemedAt: -1 }),
        db.collection("automation_sends").createIndex({ key: 1 }, { unique: true }),
        db.collection("automation_sends").createIndex({ sentAt: -1 }),
        db.collection("ai_chunks").createIndex({ hash: 1 }, { unique: true }),
        db.collection("ai_chunks").createIndex({ sourceId: 1 }),
        db.collection("ai_chunks").createIndex({ updatedAt: 1 }),
        db.collection("ai_analyses").createIndex({ createdAt: -1 }),
        db.collection("ai_analyses").createIndex({ email: 1 }),
        db.collection("ai_feedback").createIndex({ userId: 1, createdAt: -1 }),
        db.collection("ai_reports").createIndex({ createdAt: -1 }),
        db.collection("knowledge_drafts").createIndex({ status: 1, createdAt: -1 }),
        db.collection("session_recaps").createIndex({ createdAt: -1 }),
        db.collection("session_recaps").createIndex({ course: 1 }),
        db.collection("applications").createIndex({ waitlistHoldUntil: 1 }),
        db.collection("ai_agent_jobs").createIndex({ refKey: 1 }, { unique: true }),
        db.collection("ai_agent_jobs").createIndex({ status: 1, createdAt: -1 }),
        db.collection("ai_agent_jobs").createIndex({ kind: 1, updatedAt: -1 }),
        db.collection("ai_agent_log").createIndex({ createdAt: -1 }),
        db.collection("ai_agent_log").createIndex({ refKey: 1 }),
        db.collection("applications").createIndex({ agentProcessedAt: 1 }),
        db.collection("enrollments").createIndex({ agentProcessedAt: 1 }),
        db.collection("ai_usage").createIndex({ updatedAt: 1 }, { expireAfterSeconds: 8 * 86400 }),
        db.collection("attack_events").createIndex({ createdAt: -1 }),
        db.collection("attack_events").createIndex({ key: 1, createdAt: -1 }),
      ]);

      // Drop legacy redundant indexes from older schema versions (best-effort;
      // on fresh databases the drop is a no-op that resolves to "not found").
      await Promise.all([
        db.collection("notifications").dropIndex("userId_1").catch(() => {}),
        db.collection("auth_tokens").dropIndex("token_1_purpose_1").catch(() => {}),
      ]);

      // Seed the course catalog. Existing rows are OVERWRITTEN with the current
      // fallback/seed data (fees, duration, batches, syllabus) and any course no
      // longer in the list is deleted — so the published catalogue always
      // matches the source of truth and no stale/old courses linger.
      const courses = db.collection<CourseDoc>("courses");
      const now = new Date();
      const currentNames = new Set(FALLBACK_COURSES.map((c) => c.name));
      await Promise.all(
        FALLBACK_COURSES.map((c) =>
          courses.updateOne(
            { name: c.name },
            {
              $set: {
                ...c,
                updatedAt: now,
              },
              $setOnInsert: { createdAt: now },
            },
            { upsert: true }
          )
        )
      );
      await courses.deleteMany({
        name: { $nin: Array.from(currentNames) },
      });

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

/* ------------------------------------------------------------------ */
/*  AI: RAG knowledge chunks, placement analyses, feedback, reports    */
/* ------------------------------------------------------------------ */

/** One retrievable text chunk of the tutor knowledge base. */
export interface AiChunkDoc {
  _id?: unknown;
  /** Content hash — unique key used to upsert without duplicates. */
  hash: string;
  /** Where the text came from: course / faq / blog / feature. */
  source: string;
  /** Stable identifier within the source (course name, faq index, blog slug). */
  sourceId: string;
  /** Corpus category: course, module, faq, blog, feature. */
  kind: string;
  /** Human-readable heading for the source chip in the chat UI. */
  title: string;
  /** The chunk text used as retrieval context. */
  text: string;
  /** Vector embedding (absent when the knowledge base is built without an AI key). */
  embedding?: number[] | null;
  updatedAt: Date;
}

export async function getAiChunksCollection() {
  const db = await getDb();
  return db.collection<AiChunkDoc>("ai_chunks");
}

/** Stored result of an AI placement-test analysis. */
export interface AiAnalysisDoc {
  _id?: unknown;
  kind: "placement";
  /** Lead email (when provided on the placement test). */
  email?: string | null;
  name?: string | null;
  /** Raw input snapshot sent to the analyzer. */
  input: Record<string, unknown>;
  /** Structured analysis result. */
  result: Record<string, unknown>;
  /** Model id used, or null in offline mode. */
  model?: string | null;
  /** True when produced by the deterministic offline fallback. */
  offline: boolean;
  createdAt: Date;
}

export async function getAiAnalysesCollection() {
  const db = await getDb();
  return db.collection<AiAnalysisDoc>("ai_analyses");
}

/** AI essay / speaking feedback submitted by a learner. */
export interface AiFeedbackDoc {
  _id?: unknown;
  userId: string;
  kind: "essay" | "speaking";
  /** Optional prompt/task (e.g. IELTS Task 2 essay question). */
  taskPrompt?: string | null;
  /** The submitted essay or speaking transcript. */
  text: string;
  /** Full AI feedback text. */
  feedback: string;
  /** Parsed grade/band when determinable (e.g. "Band 6.5"). */
  grade?: string | null;
  model?: string | null;
  /** True when produced by the rule-based offline fallback. */
  offline: boolean;
  createdAt: Date;
}

export async function getAiFeedbackCollection() {
  const db = await getDb();
  return db.collection<AiFeedbackDoc>("ai_feedback");
}

/** AI-generated ops report (e.g. the weekly teacher-assistant summary). */
export interface AiReportDoc {
  _id?: unknown;
  kind: "weekly";
  /** Human label for the covered window, e.g. "7 days up to 5 Sep". */
  period: string;
  periodStart: Date;
  periodEnd: Date;
  /** The agent's narrative summary. */
  text: string;
  /** Structured metrics snapshot the agent gathered through tool calls. */
  metrics: Record<string, unknown>;
  model?: string | null;
  /** Number of tool calls the agent actually performed (agentic demos/evals). */
  toolCallsUsed?: number;
  /** True when produced by the offline stats fallback. */
  offline: boolean;
  requestedBy: string;
  createdAt: Date;
}

export async function getAiReportsCollection() {
  const db = await getDb();
  return db.collection<AiReportDoc>("ai_reports");
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

/* ------------------------------------------------------------------ */
/*  Growth: knowledge drafts + session recaps                          */
/* ------------------------------------------------------------------ */

/** A proposed RAG knowledge chunk waiting for an admin approval decision. */
export interface KnowledgeDraftDoc {
  _id?: unknown;
  title: string;
  faq: string;
  source: string;
  offline: boolean;
  model?: string | null;
  status: "draft" | "approved" | "rejected";
  seedId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getKnowledgeDraftsCollection() {
  const db = await getDb();
  return db.collection<KnowledgeDraftDoc>("knowledge_drafts");
}

/** An AI-generated session recap for a live class. */
export interface SessionRecapDoc {
  _id?: unknown;
  course: string;
  batch?: string | null;
  topics: string[];
  notes: string;
  students: Array<{ email: string; gap: string; suggestion: string }>;
  summary: string;
  homework: string;
  offline: boolean;
  model?: string | null;
  createdBy: string;
  createdAt: Date;
}

export async function getSessionRecapsCollection() {
  const db = await getDb();
  return db.collection<SessionRecapDoc>("session_recaps");
}

/* ------------------------------------------------------------------ */
/*  AI Operations Agent: job queue + audit log                        */
/* ------------------------------------------------------------------ */

/** One unit of work the AI agent owns (a decision/publish/ledger task). */
export interface AiAgentJobDoc {
  _id?: unknown;
  /** job kind: APPLICATION / ENROLLMENT / PAYMENT / BLOG */
  kind: string;
  /** stable unique per source record, e.g. app:<id>, enr:<id>, blog:<weekly> */
  refKey: string;
  refId?: string | null;
  status: "queued" | "running" | "done" | "skipped" | "failed";
  decision?: {
    action: string;
    reason: string;
    message?: string | null;
    paymentInstructions?: string | null;
    amount?: number;
    method?: string | null;
    note?: string | null;
  } | null;
  offline?: boolean;
  model?: string | null;
  error?: string | null;
  processedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getAiAgentJobsCollection() {
  const db = await getDb();
  return db.collection<AiAgentJobDoc>("ai_agent_jobs");
}

/** Immutable record of every action the AI agent took (decision + result). */
export interface AiAgentLogDoc {
  _id?: unknown;
  jobId?: string | null;
  kind: string;
  action: string;
  refKey: string;
  detail?: string | null;
  offline: boolean;
  model?: string | null;
  ok: boolean;
  createdAt: Date;
}

export async function getAiAgentLogCollection() {
  const db = await getDb();
  return db.collection<AiAgentLogDoc>("ai_agent_log");
}