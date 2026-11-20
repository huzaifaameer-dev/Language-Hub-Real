import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { requireAdmin, isValidId } from "@/lib/admin-guard";
import { audit } from "@/lib/server/admin";
import {
  findUserById,
  setUserDisabled,
  setUserRole,
  toSafeUser,
  updatePassword,
  updateProfile,
} from "@/lib/server/users";
import { q } from "@/lib/server/pg";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  // Single-operator policy: the panel can grant TEACHER, never ADMIN. A second
  // administrator would bypass the access-code gate's whole point, so the
  // ADMIN role is only ever set directly in the database.
  role: z.enum(["USER", "TEACHER"]).optional(),
  disabled: z.boolean().optional(),
  password: z.string().min(8).max(200).optional(),
});

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;
  if (!isValidId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  const target = await findUserById(id);
  if (!target) return NextResponse.json({ message: "User not found." }, { status: 404 });

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  // An administrator can never demote or disable their own account, which
  // would otherwise lock the owner out of the control suite.
  if (target.id === admin.id) {
    // The owner cannot demote themselves (which would lock the suite) — and
    // the schema above already prevents anyone from being promoted to ADMIN.
    if (parsed.data.role) {
      return NextResponse.json({ message: "You cannot change your own role." }, { status: 400 });
    }
    if (parsed.data.disabled === true) {
      return NextResponse.json({ message: "You cannot disable your own account." }, { status: 400 });
    }
  }

  if (parsed.data.name !== undefined || parsed.data.phone !== undefined) {
    await updateProfile(target.id, {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
    });
  }
  if (parsed.data.role) await setUserRole(target.id, parsed.data.role);
  if (parsed.data.disabled !== undefined) await setUserDisabled(target.id, parsed.data.disabled);
  if (parsed.data.password) {
    await updatePassword(target.id, await bcrypt.hash(parsed.data.password, 12));
  }

  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.user_updated",
    targetType: "user",
    targetId: target.id,
    meta: {
      role: parsed.data.role,
      disabled: parsed.data.disabled,
      passwordReset: Boolean(parsed.data.password),
    },
  });

  const updated = await findUserById(target.id);
  return NextResponse.json({ ok: true, user: updated ? toSafeUser(updated) : null });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;
  if (!isValidId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });
  if (id === admin.id) {
    return NextResponse.json({ message: "You cannot delete your own account." }, { status: 400 });
  }

  const target = await findUserById(id);
  if (!target) return NextResponse.json({ message: "User not found." }, { status: 404 });

  await q("DELETE FROM users WHERE id = $1", [id]);
  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.user_deleted",
    targetType: "user",
    targetId: id,
    meta: { email: target.email },
  });

  return NextResponse.json({ ok: true });
}
