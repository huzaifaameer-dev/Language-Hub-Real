import { NextResponse } from "next/server";
import { z } from "zod";

import { requireMgRole, logMg } from "@/lib/management/core";
import { getMessageTemplatesCollection } from "@/lib/db";
import { MgTemplateSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireMgRole(["ADMIN", "TEACHER"]);
  const col = await getMessageTemplatesCollection();
  const docs = await col.find({ active: true }).sort({ createdAt: -1 }).limit(200).toArray();
  return NextResponse.json({
    templates: docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      body: d.body,
      active: d.active,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireMgRole(["ADMIN", "TEACHER"]);
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const parsed = MgTemplateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }
  const col = await getMessageTemplatesCollection();
  const now = new Date();
  const result = await col.insertOne({
    name: parsed.data.name.trim(),
    body: parsed.data.body.trim(),
    active: parsed.data.active ?? true,
    createdBy: user.email,
    createdAt: now,
    updatedAt: now,
  });
  logMg(user, "CREATE", "template", parsed.data.name);
  return NextResponse.json({ id: String(result.insertedId), ok: true }, { status: 201 });
}