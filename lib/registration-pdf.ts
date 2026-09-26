import PDFDocument from "pdfkit";

import { PAYMENT_ACCOUNTS } from "@/lib/registration-config";

export interface RegistrationPdfInput {
  ref: string;
  name: string;
  email: string;
  course: string;
  tagline?: string;
  dob: string;
  phone: string;
  address: string;
  education: { qualification: string; institution: string; yearOfPassing: string };
  study: {
    preferredTime: string;
    focusModules: string[];
    level: string;
    hoursPerWeek: string;
    heardAbout: string;
    extras?: string | null;
  };
  payment: { method: string; note?: string | null; receiptName?: string | null };
  feeLabel: string;
  feeNote: string;
  /** Base64 data-URI of the student photo (webp/png/jpeg). */
  photoDataUri?: string | null;
  createdAt: Date;
}

const A4_WIDTH = 595.28;
const MARGIN = 46;
const CONTENT_X = MARGIN;
const CONTENT_W = A4_WIDTH - MARGIN * 2;

/** Indigo → violet brand ramp used for the header band + section rules. */
const BRAND = "#4F46E5";
const BRAND_DEEP = "#312E81";
const INK = "#0F172A";
const INK_2 = "#475569";
const INK_3 = "#94A3B8";
const LINE = "#E2E8F0";

function refDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function row(doc: PDFDocument, label: string, value: string, y: number, opts?: { gap?: number }): number {
  doc.fontSize(7.5).fillColor(INK_3).text(label.toUpperCase(), CONTENT_X + 2, y, {
    width: 132,
    lineBreak: false,
  });
  doc.fontSize(9.5).fillColor(INK_2).text(value, CONTENT_X + 140, y, {
    width: CONTENT_W - 150,
    align: "left",
  });
  return y + (opts?.gap ?? 16);
}

/** Brand header band: course title, tagline, reference + date. */
function header(doc: PDFDocument, text: string, sub: string, ref: string, y: number): number {
  doc.save().roundedRect(CONTENT_X, y, CONTENT_W, 86, 14).fill(BRAND);
  doc.save().roundedRect(CONTENT_X + 120, y + 6, CONTENT_W - 120, 74, 8);
  doc.fillOpacity(0.12).fill("#FFFFFF");
  doc.fillOpacity(1);
  doc.font("Helvetica-Bold").fontSize(17).fillColor("#FFFFFF").text("LANGUAGE HUB", CONTENT_X + 18, y + 16);
  doc.font("Helvetica").fontSize(9).fillColor("#E0E7FF").text(sub, CONTENT_X + 18, y + 38);
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#F8FAFC").text(`REF  ${ref}`, CONTENT_X + 18, y + 56, {
    characterSpacing: 1.2,
  });
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#FFFFFF").text(text, CONTENT_X + 150, y + 26, {
    width: CONTENT_W - 150,
    align: "right",
  });
  doc.font("Helvetica").fontSize(8.5).fillColor("#E0E7FF").text(refDate(), CONTENT_X + 150, y + 50, {
    width: CONTENT_W - 150,
    align: "right",
  });
  return y + 86 + 20;
}

function sectionTitle(doc: PDFDocument, title: string, y: number): number {
  doc.fillColor(BRAND).rect(CONTENT_X, y - 8, 3, 13).fill();
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(BRAND_DEEP).text(title.toUpperCase(), CONTENT_X + 10, y - 8, {
    characterSpacing: 0.6,
  });
  doc.strokeColor(LINE).lineWidth(0.8).moveTo(CONTENT_X, y + 8).lineTo(CONTENT_X + CONTENT_W, y + 8).stroke();
  return y + 22;
}

function card(doc: PDFDocument, title: string, lines: Array<[string, string]>, y: number): number {
  y = sectionTitle(doc, title, y);
  for (const [label, value] of lines) {
    if (y > 780) {
      doc.addPage();
      y = MARGIN;
    }
    y = row(doc, label, value, y);
  }
  return y + 8;
}

function photoBlock(doc: PDFDocument, photoDataUri: string | null | undefined, y: number): void {
  if (!photoDataUri) return;
  try {
    doc.save().roundedRect(A4_WIDTH - MARGIN - 74, y, 62, 74, 8).lineWidth(1).strokeColor(LINE).stroke();
    doc.image(photoDataUri, A4_WIDTH - MARGIN - 70, y + 4, { width: 54, height: 66, fit: [54, 66] });
    doc.restore();
  } catch {
    // an unparseable photo must never fail the whole PDF
  }
}

/**
 * Builds the polished registration summary PDF:
 *  1. brand header band (course + reference), student photo
 *  2. student details, academics, study preferences, fee & payment,
 *     receipt metadata, institute payment-account callout
 *  3. declaration + signature block
 * Returns the completed file as a Buffer.
 */
export async function buildRegistrationPdf(input: RegistrationPdfInput): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
    margins: { top: 40, bottom: 40, left: MARGIN, right: MARGIN },
    info: {
      Title: `${input.course} Registration — ${input.name}`,
      Author: "Language Hub",
      Subject: `Course Registration ${input.ref}`,
      Keywords: "language hub, course, registration",
    },
    bufferPages: true,
    autoFirstPage: true,
  });

  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c as Uint8Array)));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.font("Helvetica");
  doc.rect(0, 0, A4_WIDTH, 842).fill("#FFFFFF");

  let y = MARGIN + 6;
  y = header(doc, input.course, input.tagline ?? "Hub of Language Excellence", input.ref, y);
  photoBlock(doc, input.photoDataUri, y + 2);

  // ---- student details
  y = card(
    doc,
    "Student details",
    [
      ["Full name", input.name],
      ["Email", input.email],
      ["Date of birth", input.dob],
      ["Phone", input.phone],
      ["Address", input.address],
    ],
    y
  );

  // ---- academics
  y = card(
    doc,
    "Academic background",
    [
      ["Highest qualification", input.education.qualification],
      ["Institution", input.education.institution],
      ["Year of passing", input.education.yearOfPassing],
    ],
    y
  );

  // ---- study preferences
  const studyLines: Array<[string, string]> = [
    ["Preferred study time", input.study.preferredTime],
    ["Modules to enhance", input.study.focusModules.join(", ") || "—"],
    ["Current level", input.study.level],
    ["Study hours per week", input.study.hoursPerWeek],
    ["Heard about Language Hub via", input.study.heardAbout],
  ];
  if (input.study.extras) studyLines.push(["Additional", input.study.extras]);
  y = card(doc, "Study preferences", studyLines, y);

  // ---- fee & payment
  const paymentLines: Array<[string, string]> = [
    ["Payment method", input.payment.method],
    ["Programme fee", input.feeLabel],
    ["Fee note", input.feeNote],
  ];
  if (input.payment.receiptName) paymentLines.push(["Payment receipt", input.payment.receiptName]);
  if (input.payment.note) paymentLines.push(["Payment note", input.payment.note]);
  y = card(doc, "Fee & payment", paymentLines, y);

  // ---- payment account callout
  if (y > 700) {
    doc.addPage();
    y = MARGIN;
  }
  y = sectionTitle(doc, "Payment accounts", y);
  y += 2;
  for (const acct of [PAYMENT_ACCOUNTS.easypaisa, PAYMENT_ACCOUNTS.bank]) {
    if (y > 760) {
      doc.addPage();
      y = MARGIN;
    }
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND_DEEP).text(acct.label.toUpperCase(), CONTENT_X + 2, y);
    y += 15;
    for (const r of acct.rows) {
      y = row(doc, r.label, r.value, y);
    }
    y += 8;
  }

  // ---- declaration
  if (y > 690) {
    doc.addPage();
    y = MARGIN;
  }
  y = sectionTitle(doc, "Declaration", y);
  y += 2;
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(INK_2)
    .text(
      "I hereby declare that the information provided above is accurate and true. I understand that any false information may lead to cancellation of my registration.",
      CONTENT_X,
      y,
      { width: CONTENT_W, lineBreak: true }
    );
  y += 34;

  doc.strokeColor(INK_3).lineWidth(0.8).moveTo(CONTENT_X + 2, y).lineTo(CONTENT_X + 230, y).stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(INK).text(input.name, CONTENT_X, y - 14, {
    width: 230,
    align: "left",
    lineBreak: false,
  });
  doc.font("Helvetica").fontSize(7.5).fillColor(INK_3).text(`Student signature · ${refDate()}`, CONTENT_X, y + 6, {
    width: 230,
    align: "left",
    lineBreak: false,
  });
  doc.font("Helvetica").fontSize(9).fillColor(INK).text("I AGREE", A4_WIDTH - MARGIN - 90, y - 14, {
    width: 90,
    align: "right",
    lineBreak: false,
  });

  doc.end();
  return done;
}