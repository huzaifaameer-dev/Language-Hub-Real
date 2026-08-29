import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getDb, ensureIndexesAndAdmin } from "@/lib/db";
import { RegisterSchema, fieldErrors } from "@/lib/validate";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rl = rateLimit(clientKey(request, "register"), 10, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: `Too many attempts. Try again in ${rl.retryAfter}s.` },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: fieldErrors(parsed) },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;
  const normalized = email.toLowerCase();

  const db = await getDb();
  await ensureIndexesAndAdmin();
  const users = db.collection("users");

  const existing = await users.findOne({ email: normalized });
  if (existing) {
    return NextResponse.json(
      { message: "An account with this email already exists.", errors: { email: ["Email already registered."] } },
      { status: 409 }
    );
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await users.insertOne({
    name: name.trim(),
    email: normalized,
    password: hash,
    role: "USER",
    emailVerified: null,
    image: null,
    createdAt: new Date(),
  });

  return NextResponse.json(
    { id: String(result.insertedId), ok: true },
    { status: 201 }
  );
}