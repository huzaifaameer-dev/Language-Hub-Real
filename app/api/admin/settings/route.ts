import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-guard";
import { audit, loadSettings, saveSetting } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

/** All settings rows, merged into one object for the panel's settings tab. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const settings = await loadSettings();
  return NextResponse.json({ settings });
}

const PayloadSchema = z.object({
  academy: z
    .object({
      name: z.string().trim().min(2).max(80),
      tagline: z.string().trim().max(160),
      email: z.email().max(160),
      phone: z.string().trim().max(40),
      whatsapp: z.string().trim().max(40),
      city: z.string().trim().max(80),
      address: z.string().trim().max(300),
    })
    .optional(),
  stats: z
    .object({
      learners: z.number().int().min(0).max(1_000_000),
      batches: z.number().int().min(0).max(10_000),
      rating: z.number().min(0).max(5),
      satisfaction: z.number().int().min(0).max(100),
      teachers: z.number().int().min(0).max(10_000),
    })
    .optional(),
});

/** Saves the academy profile and/or the public stat figures. */
export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const parsed = PayloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  if (!parsed.data.academy && !parsed.data.stats) {
    return NextResponse.json({ message: "Nothing to update." }, { status: 400 });
  }

  if (parsed.data.academy) {
    const current = await loadSettings();
    const existing =
      current["site.academy"] && typeof current["site.academy"] === "object"
        ? (current["site.academy"] as Record<string, unknown>)
        : {};
    await saveSetting("site.academy", { ...existing, ...parsed.data.academy });
  }

  if (parsed.data.stats) {
    const current = await loadSettings();
    const existing =
      current["site.stats"] && typeof current["site.stats"] === "object"
        ? (current["site.stats"] as Record<string, unknown>)
        : {};
    await saveSetting("site.stats", { ...existing, ...parsed.data.stats });
  }

  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.settings_updated",
    targetType: "settings",
    meta: { sections: Object.keys(parsed.data) },
  });

  return NextResponse.json({ ok: true, settings: await loadSettings() });
}
