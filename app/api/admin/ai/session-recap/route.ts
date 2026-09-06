import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { getDb, getSessionRecapsCollection } from "@/lib/db";
import { generateSessionRecap } from "@/lib/growth/recap";
import { notify } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_STUDENTS = 30;
const MAX_TOPICS = 12;

/** POST — teacher pastes session notes; AI returns recap, homework + gaps. */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const rl = await rateLimitDb(await clientKey(request, "recap"), 20, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ message: "Too many requests." }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as {
    course?: unknown;
    batch?: unknown;
    topics?: unknown;
    notes?: unknown;
    studentEmails?: unknown;
  };

  const course = String(body.course ?? "").trim().slice(0, 120);
  if (!course) return NextResponse.json({ message: "Course is required." }, { status: 400 });

  const topics = Array.isArray(body.topics)
    ? body.topics.map(String).filter((t) => t.trim()).slice(0, MAX_TOPICS)
    : [];
  const notes = String(body.notes ?? "").trim().slice(0, 4000);
  const studentEmails = Array.isArray(body.studentEmails)
    ? body.studentEmails
        .map(String)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, MAX_STUDENTS)
    : [];

  try {
    const { recap, offline, model } = await generateSessionRecap({
      course,
      batch: body.batch ? String(body.batch).slice(0, 40) : undefined,
      topics,
      notes,
      studentEmails,
    });

    const col = await getSessionRecapsCollection();
    const created = await col.insertOne({
      course,
      batch: body.batch ? String(body.batch).slice(0, 40) : null,
      topics,
      notes,
      students: recap.gaps.map((g) => ({
        email: g.student,
        gap: g.gap,
        suggestion: g.suggestion,
      })),
      summary: recap.summary,
      homework: recap.homework,
      offline,
      model,
      createdBy: admin.email ?? admin.id,
      createdAt: new Date(),
    });

    // Notify matched students in-app so they see their recap on the dashboard.
    if (studentEmails.length > 0) {
      const db = await getDb();
      const users = await db
        .collection("users")
        .find({ email: { $in: studentEmails } })
        .project({ _id: 1 })
        .toArray();
      await Promise.all(
        users.map((u) =>
          notify(String(u._id), {
            kind: "session-recap",
            title: `New class recap · ${course}`,
            message: recap.summary.slice(0, 160),
            href: "/dashboard",
          })
        )
      );
    }

    return NextResponse.json({
      recap: {
        id: String(created.insertedId),
        course,
        summary: recap.summary,
        homework: recap.homework,
        gaps: recap.gaps,
        offline,
        model,
      },
    });
  } catch {
    return NextResponse.json({ message: "Could not generate the recap. Try again." }, { status: 500 });
  }
}