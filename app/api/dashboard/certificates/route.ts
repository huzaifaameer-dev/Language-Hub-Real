import { NextResponse } from "next/server";

import { currentUser } from "@/lib/server/session";
import { issueCertificate, listCertificates } from "@/lib/server/learner";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const rows = await listCertificates(user.id);
  return NextResponse.json({
    certificates: rows.map((c) => ({
      id: c.id,
      certificateId: c.certificate_id,
      studentName: c.student_name,
      course: c.course,
      batch: c.batch,
      issuedAt: new Date(c.issued_at).toISOString(),
      completionPercent: c.completion_percent,
      signedBy: c.signed_by,
    })),
  });
}

/** Issues a certificate once at least 80% of the active course is complete. */
export async function POST() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const result = await issueCertificate(user.id);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    certificate: {
      id: result.certificate.id,
      certificateId: result.certificate.certificate_id,
      course: result.certificate.course,
      issuedAt: new Date(result.certificate.issued_at).toISOString(),
      completionPercent: result.certificate.completion_percent,
    },
  });
}
