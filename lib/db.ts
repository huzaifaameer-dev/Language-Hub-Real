import { MongoClient } from "mongodb";
import type { Db } from "mongodb";
import bcrypt from "bcryptjs";

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

export type Course = (typeof COURSE_LIST)[number];

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

/**
 * Ensures indexes + the admin account exist. Idempotent; safe to call on
 * every server request that touches auth/admin data.
 */
export async function ensureIndexesAndAdmin(): Promise<void> {
  const db = await getDb();

  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("applications").createIndex({ userId: 1 }),
    db.collection("applications").createIndex({ status: 1 }),
    db.collection("applications").createIndex({ createdAt: -1 }),
    db.collection("enrollments").createIndex({ userId: 1 }),
    db.collection("enrollments").createIndex({ status: 1 }),
    db.collection("enrollments").createIndex({ applicationId: 1 }),
    db.collection("enrollments").createIndex({ createdAt: -1 }),
  ]);

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return;

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
    return;
  }

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