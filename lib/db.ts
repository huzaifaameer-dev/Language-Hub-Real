import { MongoClient } from "mongodb";
import type { Db } from "mongodb";
import bcrypt from "bcryptjs";
import type { CourseInfo } from "@/lib/course-data";
import { FALLBACK_COURSES } from "@/lib/course-data";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB ?? "languagehub";

/**
 * Bump when the admin seed shape/password handling changes so stored admins
 * get re-hashed with the current ADMIN_PASSWORD on the next ensure call.
 */
const SEED_VERSION = 2;

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

if (process.env.NODE_ENV !== "production") {
  globalThis.lhMongo = clientPromise;
}

export function getDb(): Promise<Db> {
  return clientPromise.then((c) => c.db(dbName));
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

export type EnrollmentStatus = "PENDING" | "ENROLLED" | "REJECTED";

export interface EnrollmentDoc {
  _id?: unknown;
  userId: string;
  applicationId: string;
  name: string;
  email: string;
  subjects: Course[];
  batch: string;
  plan?: string;
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
        db.collection("applications").createIndex({ createdAt: -1 }),
        db.collection("enrollments").createIndex({ userId: 1 }),
        db.collection("enrollments").createIndex({ status: 1 }),
        db.collection("enrollments").createIndex({ applicationId: 1 }),
        db.collection("enrollments").createIndex({ createdAt: -1 }),
        db.collection("notifications").createIndex({ userId: 1 }),
        db.collection("notifications").createIndex({ userId: 1, read: 1 }),
        db.collection("notifications").createIndex({ userId: 1, createdAt: -1 }),
        db.collection("auth_tokens").createIndex({ token: 1 }, { unique: true }),
        db.collection("auth_tokens").createIndex({ token: 1, purpose: 1 }),
        db.collection("auth_tokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        db.collection("courses").createIndex({ name: 1 }, { unique: true }),
        db.collection("courses").createIndex({ active: 1, order: 1 }),
        db.collection("settings").createIndex({ key: 1 }, { unique: true }),
        db.collection("ratelimits").createIndex({ resetAt: 1 }, { expireAfterSeconds: 1 }),
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
    })().catch((err) => {
      initPromise = null; // allow retry on the next request
      throw err;
    });
  }
  return initPromise;
}

/** Backwards-compatible alias (older modules). */
export const ensureIndexesAndAdmin = ensureInit;