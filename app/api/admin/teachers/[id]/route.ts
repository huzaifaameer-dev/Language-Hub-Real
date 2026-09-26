import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { requireAdmin, isValidObjectId } from "@/lib/admin-guard";
import { getGroupsCollection, getTeachersCollection, getUsersCollection, logAdminAction } from "@/lib/db";

const PatchSchema = z.object({
  action: z.enum(["RESET_PASSWORD", "SET_NAME", "SET_STATUS"]),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200).optional(),
  name: z.string().trim().min(2).max(80).optional(),
  disabled: z.boolean().optional(),
});

/** PATCH — manage one teacher: reset password, rename, enable/disable. Super-admin only. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ message: "Bad staff id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  const { action } = parsed.data;
  const users = await getUsersCollection();
  const target = await users.findOne(
    { _id: new ObjectId(id), role: { $in: ["ADMIN", "TEACHER"] } },
    { projection: { email: 1, role: 1 } }
  );
  if (!target) {
    return NextResponse.json({ message: "Staff member not found." }, { status: 404 });
  }

  // The super admin must never lock themselves out.
  const isSelf = String(target._id) === String(admin.id);
  if (isSelf && action === "SET_STATUS" && parsed.data.disabled === true) {
    return NextResponse.json(
      { message: "You cannot disable your own account." },
      { status: 400 }
    );
  }
  if ((target.role as string) === "ADMIN" && action === "RESET_PASSWORD") {
    return NextResponse.json(
      { message: "Admins change their password through the server secrets." },
      { status: 400 }
    );
  }

  const $set: Record<string, unknown> = { updatedAt: new Date() };

  if (action === "RESET_PASSWORD" && parsed.data.password) {
    $set.password = await bcrypt.hash(parsed.data.password, 12);
    $set.failedAttempts = 0;
    $set.lockUntil = null;
  } else if (action === "SET_NAME" && parsed.data.name) {
    $set.name = parsed.data.name;
  } else if (action === "SET_STATUS" && typeof parsed.data.disabled === "boolean") {
    $set.disabled = parsed.data.disabled;
  }

  await users.updateOne({ _id: new ObjectId(id) }, { $set });

  void logAdminAction({
    actor: admin.email ?? "admin",
    action: `${action}${action === "SET_STATUS" ? (parsed.data.disabled ? "·DISABLE" : "·ENABLE") : ""}`,
    targetType: "teacher",
    targetLabel: (target.email as string) ?? String(id),
  });

  return NextResponse.json({ ok: true });
}

/** DELETE — remove a teacher account entirely. Super-admin only. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ message: "Bad staff id." }, { status: 400 });
  }

  const users = await getUsersCollection();
  const target = await users.findOne(
    { _id: new ObjectId(id), role: "TEACHER" },
    { projection: { email: 1 } }
  );
  if (!target) {
    return NextResponse.json({ message: "Teacher not found." }, { status: 404 });
  }

  void logAdminAction({
    actor: admin.email ?? "admin",
    action: "DELETE_TEACHER",
    targetType: "teacher",
    targetLabel: (target.email as string) ?? String(id),
  });

  await users.deleteOne({ _id: new ObjectId(id) });

  // Drop the management roster row and unassign the teacher from every group.
  await getTeachersCollection().then((c) => c.deleteOne({ userId: String(id) }));
  await getGroupsCollection().then((c) =>
    c.updateMany(
      { teacherIds: String(id) },
      { $pull: { teacherIds: String(id) }, $set: { updatedAt: new Date() } }
    )
  );

  return NextResponse.json({ ok: true, deleted: true });
}