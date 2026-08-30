import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getApplicationsCollection, ensureIndexesAndAdmin } from "@/lib/db";
import { publishEvent } from "@/lib/realtime";
import { ApplicationSchema, fieldErrors } from "@/lib/validate";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { notifyAdmins, listAdminEmails } from "@/lib/notifications";
import { sendNewApplicationEmail } from "@/lib/email";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const rl = await rateLimitDb(clientKey(request, `apply:${session.user.id}`), 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many submissions. Please wait a while." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = ApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: fieldErrors(parsed) },
      { status: 400 }
    );
  }

  await ensureIndexesAndAdmin();

  const data = parsed.data;
  const applications = await getApplicationsCollection();

  const now = new Date();
  const result = await applications.insertOne({
    userId: session.user.id,
    name: data.name.trim(),
    email: (session.user.email ?? "").trim(),
    place: data.place.trim(),
    bio: data.bio.trim(),
    course: data.course,
    message: data.message || undefined,
    status: "PENDING",
    adminMessage: null,
    createdAt: now,
    updatedAt: now,
  });

publishEvent({ table: "applications", userId: session.user.id, at: Date.now() });

await notifyAdmins({
  kind: "application",
  title: "New application",
  message: `${data.name.trim()} applied for ${data.course}.`,
  href: "/admin-panel",
});

void listAdminEmails().then((emails) => {
  void Promise.all(
    emails.map((to) =>
      sendNewApplicationEmail({ to, applicant: data.name.trim(), course: data.course })
    )
  );
});

return NextResponse.json(
    { id: String(result.insertedId), ok: true, status: "PENDING" },
    { status: 201 }
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  await ensureIndexesAndAdmin();
  const applications = await getApplicationsCollection();

  const docs = await applications
    .find({ userId: session.user.id }, { projection: { userId: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  const list = docs.map((d) => ({
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

  return NextResponse.json({ applications: list });
}