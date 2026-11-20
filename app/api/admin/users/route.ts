import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/server/admin";
import { createUser, listUsers } from "@/lib/server/users";
import { findUserByEmail } from "@/lib/server/users";
import { toSafeUser } from "@/lib/server/users";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(160),
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(8).max(200),
  // Single-operator policy: ADMIN cannot be granted from the panel.
  role: z.enum(["USER", "TEACHER"]).default("USER"),
});

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";
  const role = (url.searchParams.get("role") ?? "ALL").toUpperCase();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const limit = 20;

  const { rows, total } = await listUsers({
    search,
    role: role === "ALL" ? "ALL" : (role as "USER" | "ADMIN" | "TEACHER"),
    limit,
    offset: (page - 1) * limit,
  });

  return NextResponse.json({
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    users: rows.map((u) => ({
      ...toSafeUser(u),
      registrations: Number(u.registrations ?? 0),
      enrollments: Number(u.enrollments ?? 0),
      lastLoginAt: u.last_login_at ? new Date(u.last_login_at).toISOString() : null,
    })),
  });
}

/** Creates an account (used to add teachers or staff from the panel). */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const parsed = CreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  if (await findUserByEmail(parsed.data.email)) {
    return NextResponse.json({ message: "That email is already registered." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const created = await createUser({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    passwordHash,
    role: parsed.data.role,
  });

  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.user_created",
    targetType: "user",
    targetId: created.id,
    meta: { email: created.email, role: created.role },
  });

  return NextResponse.json({ ok: true, user: toSafeUser(created) }, { status: 201 });
}
