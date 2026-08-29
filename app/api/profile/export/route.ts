import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { getDb, COURSE_LIST } from "@/lib/db";

/**
 * GDPR-style data export: everything this app stores about the signed-in user.
 * Downloads as a JSON file (no sensitive admin data is included).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 400 });
  }

  const db = await getDb();
  const userId = session.user.id;

  const [user, applications, enrollments, notifications] = await Promise.all([
    db
      .collection("users")
      .findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0, seedVersion: 0, failedAttempts: 0, lockUntil: 0 } }
      ),
    db.collection("applications").find({ userId }).sort({ createdAt: -1 }).toArray(),
    db.collection("enrollments").find({ userId }).sort({ createdAt: -1 }).toArray(),
    db.collection("notifications").find({ userId }).sort({ createdAt: -1 }).toArray(),
  ]);

  if (!user) {
    return NextResponse.json(
      { message: "Session expired. Sign in again." },
      { status: 401 }
    );
  }

  const toIso = (d: unknown) => (d instanceof Date ? d.toISOString() : null);

  const data = {
    exportedAt: new Date().toISOString(),
    profile: {
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp ?? "",
      image: user.image ?? null,
      role: user.role ?? "USER",
      createdAt: toIso(user.createdAt),
    },
    applications: applications.map((a) => ({
      id: String(a._id),
      ...Object.fromEntries(
        Object.entries(a).filter(([k]) => !["_id", "userId"].includes(k))
      ),
    })),
    enrollments: enrollments.map((e) => ({
      id: String(e._id),
      ...Object.fromEntries(
        Object.entries(e).filter(([k]) => !["_id", "userId"].includes(k))
      ),
    })),
    notifications: notifications.map((n) => ({
      id: String(n._id),
      kind: n.kind,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: toIso(n.createdAt),
    })),
    courses: COURSE_LIST,
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="language-hub-export-${userId}.json"`,
      "Cache-Control": "no-store",
    },
  });
}