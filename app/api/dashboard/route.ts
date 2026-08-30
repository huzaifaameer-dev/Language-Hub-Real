import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import {
  getApplicationsCollection,
  getEnrollmentsCollection,
  getUsersCollection,
} from "@/lib/db";
import { getPublicCatalog } from "@/lib/course-stats";

export const dynamic = "force-dynamic";

/**
 * One-shot payload for the student dashboard: replaces four round-trips
 * (/api/me, /api/applications, /api/enrollments, /api/courses) with one.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 400 });
  }

  const user = await getUsersCollection().then((users) =>
    users.findOne({ _id: new ObjectId(session.user.id) })
  );
  if (!user) {
    return NextResponse.json({ message: "Session expired. Sign in again." }, { status: 401 });
  }

  const [applications, enrollments, catalog] = await Promise.all([
    (async () => {
      const col = await getApplicationsCollection();
      const docs = await col
        .find({ userId: session.user.id }, { projection: { userId: 0 } })
        .sort({ createdAt: -1 })
        .toArray();
      return docs.map((d) => ({
        id: String(d._id),
        name: d.name,
        email: d.email,
        place: d.place,
        bio: d.bio,
        course: d.course,
        message: d.message,
        status: d.status,
        adminMessage: d.adminMessage,
        createdAt: d.createdAt.toISOString(),
      }));
    })(),
    (async () => {
      const col = await getEnrollmentsCollection();
      const docs = await col
        .find({ userId: session.user.id }, { projection: { userId: 0 } })
        .sort({ createdAt: -1 })
        .toArray();
      return docs.map((d) => ({
        id: String(d._id),
        applicationId: d.applicationId,
        name: d.name,
        email: d.email,
        subjects: d.subjects,
        batch: d.batch,
        plan: d.plan,
        status: d.status,
        adminMessage: d.adminMessage,
        createdAt: d.createdAt.toISOString(),
      }));
    })(),
    getPublicCatalog(),
  ]);

  const adminRow = await getUsersCollection().then((col) =>
    col.findOne({ role: "ADMIN" }, { projection: { email: 1 } })
  );

  return NextResponse.json({
    user: {
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp ?? "",
      role: user.role ?? "USER",
      image: user.image ?? null,
      createdAt: user.createdAt?.toISOString?.() ?? null,
    },
    support: {
      email: adminRow?.email ?? null,
      whatsapp: process.env.ACADEMY_WHATSAPP?.replace(/[^\d]/g, "") || null,
    },
    applications,
    enrollments,
    courses: catalog.courses,
  });
}