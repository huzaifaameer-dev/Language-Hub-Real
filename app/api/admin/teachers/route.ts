import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-guard";
import { ensureIndexesAndAdmin, getTeachersCollection, getUsersCollection, logAdminAction } from "@/lib/db";

export const dynamic = "force-dynamic";

const CreateTeacherSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  email: z
    .string()
    .email("A valid email is required.")
    .max(200)
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

/** GET — staff directory (admins + teachers). Super-admin only. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  await ensureIndexesAndAdmin();
  const users = await getUsersCollection();
  const docs = await users
    .find({ role: { $in: ["ADMIN", "TEACHER"] } })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  const safeIso = (d: unknown): string => {
    if (!d) return new Date().toISOString();
    try {
      const date = d instanceof Date ? d : new Date(d as string | number | Date);
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const list = docs.map((d) => {
    const raw = d as unknown as { name: string; email: string; role?: string; disabled?: boolean; createdAt: Date };
    return {
      id: String(d._id),
      name: raw.name,
      email: raw.email,
      role: raw.role === "TEACHER" ? "TEACHER" : "ADMIN",
      disabled: raw.disabled === true,
      createdAt: safeIso(raw.createdAt),
    };
  });

  return NextResponse.json({ teachers: list });
}

/** POST — create a teacher account with login credentials. Super-admin only. */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = CreateTeacherSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  await ensureIndexesAndAdmin();
  const users = await getUsersCollection();

  const duplicate = await users.findOne({ email });
  if (duplicate) {
    return NextResponse.json(
      { message: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const hash = await bcrypt.hash(password, 12);
  const now = new Date();
  const result = await users.insertOne({
    name,
    email,
    password: hash,
    role: "TEACHER",
    disabled: false,
    emailVerified: null,
    image: null,
    createdAt: now,
    updatedAt: now,
  });

  // Keep the management roster in sync so this teacher appears immediately in
  // /management → Groups → "Assign teacher".
  const teachers = await getTeachersCollection();
  await teachers.updateOne(
    { userId: String(result.insertedId) },
    {
      $setOnInsert: {
        userId: String(result.insertedId),
        name,
        email,
        phone: null,
        courseIds: [],
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true }
  );

  void logAdminAction({
    actor: admin.email ?? "admin",
    action: "CREATE_TEACHER",
    targetType: "teacher",
    targetLabel: email,
  });

  return NextResponse.json(
    { ok: true, id: String(result.insertedId) },
    { status: 201 }
  );
}