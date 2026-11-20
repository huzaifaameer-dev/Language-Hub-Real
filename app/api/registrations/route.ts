import { NextResponse, after } from "next/server";

import { botGuardError } from "@/lib/bot-check";
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
import {
  saveDataUriUpload,
  savePdf,
  readPrivateFile,
  dataUriParts,
  type StoredFile,
} from "@/lib/registration-storage";
import { buildRegistrationPdf } from "@/lib/registration-pdf";
import { courseSlug } from "@/lib/course-data";
import { currentUser } from "@/lib/server/session";
import { createRegistration, listRegistrationsForUser } from "@/lib/server/learner";

export const dynamic = "force-dynamic";

/**
 * Course registration intake for a signed-in learner.
 *
 * Security: session identity (email never comes from the body), per-user rate
 * limit, honeypot guard, strict zod caps on every field and upload (PNG/JPEG/
 * WebP/PDF only), and uploads stored under `private/` — served only through
 * the auth-guarded media route. A signed PDF summary is emailed to the admin
 * inbox and, when requested, to the student.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const rl = await rateLimitDb(`reg-${user.id}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      {
        message: `You've submitted too many registrations recently. Try again in ${rl.retryAfter}s.`,
      },
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

  const studentName = user.name || "Learner";
  const studentEmail = user.email;

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
  const photoParts = u.photo ? dataUriParts(u.photo) : null;

  try {
    photoStored = await saveDataUriUpload(ref, "photo", u.photo);
  } catch (err) {
    console.error("[registrations] photo save failed:", (err as Error).message);
    return NextResponse.json(
      { message: "Could not store your photo. Please try again." },
      { status: 500 }
    );
  }

  if (u.payment.receipt) {
    try {
      receiptStored = await saveDataUriUpload(ref, "receipt", u.payment.receipt);
      receiptBuffer = await readPrivateFile(receiptStored.ref);
    } catch (err) {
      console.error("[registrations] receipt save failed:", (err as Error).message);
      return NextResponse.json(
        { message: "Could not store your payment receipt. Please try again." },
        { status: 500 }
      );
    }
  }

  const proofEmbeddable =
    !!receiptBuffer &&
    (receiptBuffer.mime === "image/png" || receiptBuffer.mime === "image/jpeg");

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
      photo: photoParts ? { buffer: photoParts.buffer, mime: photoParts.mime } : null,
      paymentProof: proofEmbeddable ? receiptBuffer : null,
      createdAt: new Date(),
    });
    pdfStored = await savePdf(ref, pdfBuffer);
  } catch (err) {
    console.error("[registrations] pdf build failed:", (err as Error).message);
    return NextResponse.json(
      { message: "Could not prepare your registration. Please try again." },
      { status: 500 }
    );
  }

  let row;
  try {
    row = await createRegistration({
      userId: user.id,
      courseKey: u.courseKey,
      courseSlug: courseSlug(course.catalogName),
      fullName: studentName,
      email: studentEmail,
      phone: u.phone,
      dob: u.dob,
      address: u.address,
      details: {
        education: u.education,
        study: { ...u.study, extras: extrasLabel },
        payment: {
          method: u.payment.method,
          note: u.payment.note ?? null,
          receipt: receiptStored?.ref ?? null,
          receiptName: u.payment.receiptName ?? null,
        },
        photo: photoStored?.ref ?? null,
        agreed: u.agreed,
        pdfPath: pdfStored?.ref ?? null,
        pdfAttached: true,
      },
      sendCopy: u.sendCopy,
      photoPath: photoStored?.ref ?? null,
      receiptPath: receiptStored?.ref ?? null,
    });
  } catch (err) {
    console.error("[registrations] insert failed:", (err as Error).message);
    return NextResponse.json(
      { message: "Could not save your registration. Please try again." },
      { status: 500 }
    );
  }

  ref = row.ref;

  const extraAttachments =
    receiptStored && receiptBuffer && !proofEmbeddable
      ? [
          {
            filename:
              u.payment.receiptName ??
              `receipt-${ref}.${receiptBuffer.mime.split("/")[1] ?? "file"}`,
            content: receiptBuffer.buffer,
            contentType: receiptBuffer.mime,
          },
        ]
      : null;

  after(async () => {
    await sendRegistrationEmail({
      to: REGISTRATION_NOTIFY_EMAIL,
      studentName,
      course: course.name,
      ref,
      pdf: pdfBuffer,
      extraAttachments,
      adminCopy: true,
    });

    if (u.sendCopy && studentEmail) {
      await sendRegistrationEmail({
        to: studentEmail,
        studentName,
        course: course.name,
        ref,
        pdf: pdfBuffer,
        adminCopy: false,
      });
    }
  });

  await notify(user.id, {
    kind: "registration",
    title: "Registration received",
    message: `Your ${course.name} registration (${ref}) was received. We'll reply within 24 hours.`,
    href: "/dashboard?tab=registrations",
  });

  return NextResponse.json({ ok: true, ref, id: row.id }, { status: 201 });
}

/** The signed-in learner's registrations, newest first. */
export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const rows = await listRegistrationsForUser(user.id);
  return NextResponse.json({
    registrations: rows.slice(0, 50).map((r) => ({
      id: r.id,
      ref: r.ref,
      course: r.course_slug.replace(/-/g, " "),
      courseKey: r.course_key,
      status: r.status,
      pdfAttached: Boolean(r.pdf_path),
      createdAt: new Date(r.created_at).toISOString(),
    })),
  });
}
