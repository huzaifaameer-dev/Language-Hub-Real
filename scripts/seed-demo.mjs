/**
 * Demo-seed script — creates realistic sample data for the autonomous AI admin
 * to play with fresh (a couple of users, applications, enrollments, a demo
 * booking). Biographies include a real goal so the agent APPROVES them; one
 * deliberately minimal application exercises the CLARIFY path.
 *
 * Usage: node scripts/seed-demo.mjs
 * Reads MONGODB_URI / MONGODB_DB from .env.local automatically.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient, ObjectId } from "mongodb";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnvLocal() {
  const file = path.join(root, ".env.local");
  if (!existsSync(file)) return {};
  const env = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[m[1]] = value;
  }
  return env;
}

const env = { ...process.env, ...loadEnvLocal() };
const uri = env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const dbName = env.MONGODB_DB ?? "languagehub";

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
await client.connect();
const db = client.db(dbName);
const now = new Date();
const id = () => new ObjectId();

const users = [
  { _id: id(), name: "Ahmed Raza", email: "ahmed@demo.local", role: "USER", password: "", emailVerified: null, image: null, createdAt: now },
  { _id: id(), name: "Fatima Zahra", email: "fatima@demo.local", role: "USER", password: "", emailVerified: null, image: null, createdAt: now },
];
const apps = [
  {
    _id: id(),
    userId: String(users[0]._id),
    name: "Ahmed Raza",
    email: "ahmed@demo.local",
    place: "Lahore",
    bio: "I want to reach Band 7 in IELTS for my university admission next year.",
    course: "IELTS Preparation",
    message: "Please enroll me in the morning batch.",
    status: "PENDING",
    adminMessage: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: id(),
    userId: String(users[1]._id),
    name: "Fatima Zahra",
    email: "fatima@demo.local",
    place: "Karachi",
    bio: "",
    message: "hi",
    course: "Spoken English",
    status: "PENDING",
    adminMessage: null,
    createdAt: now,
    updatedAt: now,
  },
];
const enrollments = [
  {
    _id: id(),
    userId: String(users[0]._id),
    applicationId: String(apps[0]._id),
    name: "Ahmed Raza",
    email: "ahmed@demo.local",
    subjects: ["IELTS Preparation"],
    batch: "Morning",
    plan: "Beginner friendly",
    paymentMethod: "easypaisa",
    paymentInstructions: null,
    paymentProof: null,
    status: "PENDING",
    adminMessage: null,
    createdAt: now,
    updatedAt: now,
  },
];
const demos = [
  {
    _id: id(),
    name: "Sana Malik",
    email: "sana@demo.local",
    phone: "+923001112233",
    preferredDate: "2026-01-20",
    preferredTime: "10:00 AM",
    course: "Duolingo English Test",
    message: null,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  },
];

const inserted = await Promise.all([
  db.collection("users").insertMany(users),
  db.collection("applications").insertMany(apps),
  db.collection("enrollments").insertMany(enrollments),
  db.collection("demo_bookings").insertMany(demos),
]);

console.log(
  `Demo data seeded into "${dbName}": 2 users, 2 applications (1 approve-ready, 1 clarify), 1 enrollment, 1 demo booking.`
);
console.log("The autonomous AI agent will pick these up on its next run (or on demand via the admin AI tab).");

await client.close();