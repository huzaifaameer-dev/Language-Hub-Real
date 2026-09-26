import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { botGuardError } from "@/lib/bot-check";
import { getRegistrationsCollection, getUsersCollection, ensureIndexesAndAdmin } from "@/lib/db";
import type { RegistrationDoc } from "@/lib/db";
import { RegistrationSchema, fieldErrors } from "@/lib/validate";
import { rateLimitDb } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";
import { sendRegistrationEmail } from "@/lib/email";
import {
  REGISTRATION_NOTIFY_EMAIL,
  REGISTRATION_COURSES_BY_KEY,
  optionLabel,
  optionLabels,
  registrationFeeLabel,
  registrationFeeNote,
  makeRegistrationRef,
} from "@/lib/registration-config";
import { saveDataUriUpload, savePdf, readPrivateFile, type StoredFile } from "@/lib/registration-storage";
import { buildRegistrationPdf } from "@/lib/registration-pdf";

export const dynamic = "force-dynamic";
// Photo (≤3MB) + receipt (≤10MB) travel as base64 data-URIs in one request.
export const bodySizeLimit = "20mb";

/**
 * Course registration intake.
 *
 * Security posture:
 *  - authenticated only (session user is the identity; email is never taken
 *    from the request body),
 *  - per-user rate limiting + honeypot anti-bot guard,
 *  - strict zod validation with hard caps on every field and on the uploaded
 *    receipt (PNG/JPEG/WebP/PDF only, ≤ 10 MB) and photo (PNG/JPEG/WebP ≤ 3 MB),
 *  - uploads and the generated PDF live under `private/` and are served only
 *    through the auth-guarded media route,
 *  - the full summary is emailed to the admin inbox (PDF attachment) and —
 *    when requested — a personal copy is emailed back to the student.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const userId = session.user.id;
  if (!ObjectId.isValid(userId)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 401 });
  }
  const rl = await rateLimitDb(`reg-${userId}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: `You've submitted too many registrations recently. Try again in ${rl.retryAfter}s.` },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const bot = botGuardError(body);
  if (bot) {
    return NextResponse.json({ message: bot }, { status: 400 });
  }

  const parsed = RegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please review the highlighted fields.", errors: fieldErrors(parsed) },
      { status: 400 }
    );
  }

  const u = parsed.data;
  const course = REGISTRATION_COURSES_BY_KEY[u.courseKey];
  if (!course) {
    return NextResponse.json({ message: "Unknown course." }, { status: 400 });
  }

  const user = await getUsersCollection().then((col) =>
    col.findOne({ _id: new ObjectId(userId) }, { projection: { name: 1, email: 1 } })
  );
  if (!user) {
    return NextResponse.json({ message: "Session expired. Sign in again." }, { status: 401 });
  }
  const studentName = String(user.name ?? "Learner");
  const studentEmail = String(user.email ?? "");

  // Human labels derived from the canonical values (for the PDF and admin view).
  const preferredTimeLabel = optionLabel(course.preferredTimeOptions, u.study.preferredTime);
  const focusModuleLabels = optionLabels(course.focusOptions, u.study.focusModules);
  const levelLabel = optionLabel(course.levelOptions, u.study.level);
  const hoursLabel = optionLabel(course.hoursOptions, u.study.hoursPerWeek);
  const heardLabel = optionLabel(course.heardOptions, u.study.heardAbout);
  const extrasLabel = u.study.extras
    ? optionLabel(course.extraQuestion?.options ?? [], u.study.extras)
    : null;

  let ref = makeRegistrationRef();
  let photoStored: StoredFile | null = null;
  let receiptStored: StoredFile | null = null;
  let pdfStored: StoredFile | null = null;
  let pdfBuffer: Buffer | null = null;
  let receiptBuffer: { buffer: Buffer; mime: string } | null = null;

  try {
    photoStored = await saveDataUriUpload(ref, "photo", u.photo);
  } catch (err) {
    console.error("[registrations] photo save failed:", (err as Error).message);
    return NextResponse.json({ message: "Could not store your photo. Please try again." }, { status: 500 });
  }

  if (u.payment.receipt) {
    try {
      receiptStored = await saveDataUriUpload(ref, "receipt", u.payment.receipt);
      receiptBuffer = await readPrivateFile(receiptStored.ref);
    } catch (err) {
      console.error("[registrations] receipt save failed:", (err as Error).message);
      return NextResponse.json({ message: "Could not store your payment receipt. Please try again." }, { status: 500 });
    }
  }

  try {
    pdfBuffer = await buildRegistrationPdf({
      ref,
      name: studentName,
      email: studentEmail,
      course: course.name,
      tagline: course.tagline,
      dob: u.dob,
      phone: u.phone,
      address: u.address,
      education: u.education,
      study: {
        preferredTime: preferredTimeLabel,
        focusModules: focusModuleLabels,
        level: levelLabel,
        hoursPerWeek: hoursLabel,
        heardAbout: heardLabel,
        extras: extrasLabel,
      },
      payment: {
        method: u.payment.method,
        note: u.payment.note,
        receiptName: u.payment.receiptName,
      },
      feeLabel: registrationFeeLabel(course),
      feeNote: registrationFeeNote(course),
      photoDataUri: u.photo,
      createdAt: new Date(),
    });
    pdfStored = await savePdf(ref, pdfBuffer);
  } catch (err) {
    console.error("[registrations] pdf build failed:", (err as Error).message);
    return NextResponse.json({ message: "Could not prepare your registration. Please try again." }, { status: 500 });
  }

  await ensureIndexesAndAdmin();
  const registrations = await getRegistrationsCollection();

  // Retry on the rare unique-index collision on `ref`.
  let inserted: import("mongodb").InsertOneResult<RegistrationDoc> | null = null;
  for (let attempt = 0; attempt < 4 && !inserted; attempt += 1) {
    try {
      inserted = await registrations.insertOne({
        ref,
        userId,
        name: studentName,
        email: studentEmail,
        courseKey: u.courseKey,
        course: course.name,
        dob: u.dob,
        phone: u.phone,
        address: u.address,
        education: u.education,
        study: {
          ...u.study,
          extras: extrasLabel,
        },
        payment: {
          method: u.payment.method,
          note: u.payment.note ?? null,
          receipt: receiptStored?.ref ?? null,
          receiptName: u.payment.receiptName ?? null,
        },
        photo: photoStored?.ref ?? null,
        agreed: u.agreed,
        sendCopy: u.sendCopy,
        status: "NEW",
        pdfPath: pdfStored?.ref ?? null,
        pdfAttached: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (err) {
      const code = (err as { code?: number })?.code;
      if (code === 11000) {
        ref = makeRegistrationRef();
        continue;
      }
      throw err;
    }
  }
  if (!inserted) {
    return NextResponse.json({ message: "Could not save your registration. Please try again." }, { status: 500 });
  }

  const registrationId = String(inserted.insertedId);

  // Receipt attachment for the admin digest (image or PDF).
  const extraAttachments = receiptStored && receiptBuffer
    ? [
        {
          filename: u.payment.receiptName ?? `receipt-${ref}.${receiptBuffer.mime.split("/")[1] ?? "file"}`,
          content: receiptBuffer.buffer,
          contentType: receiptBuffer.mime,
        },
      ]
    : null;

  // Notify the admin inbox — this carries the source-of-truth PDF.
  void sendRegistrationEmail({
    to: REGISTRATION_NOTIFY_EMAIL,
    studentName,
    course: course.name,
    ref,
    pdf: pdfBuffer,
    extraAttachments,
    adminCopy: true,
  }).catch(() => {});

  // Student confirmation + their responses when "send me a copy" was ticked.
  if (u.sendCopy && studentEmail) {
    void sendRegistrationEmail({
      to: studentEmail,
      studentName,
      course: course.name,
      ref,
      pdf: pdfBuffer,
      adminCopy: false,
    }).catch(() => {});
  }

  await notify(userId, {
    kind: "registration",
    title: "Registration received",
    message: `Your ${course.name} registration (${ref}) was received. We'll reply within 24 hours.`,
    href: "/dashboard",
  });

  return NextResponse.json({ ok: true, ref, id: registrationId }, { status: 201 });
}

/** List the signed-in student's registrations (newest first). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  const registrations = await getRegistrationsCollection();
  const docs = await registrations
    .find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  return NextResponse.json({
    registrations: docs.map((d) => ({
      id: String(d._id),
      ref: d.ref,
      course: d.course,
      courseKey: d.courseKey,
      status: d.status,
      pdfAttached: d.pdfAttached,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}