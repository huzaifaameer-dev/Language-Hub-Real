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
  /** Student portrait (PNG/JPEG). Others fall back to a framed placeholder. */
  photo?: { buffer: Buffer; mime: string } | null;
  /** Payment proof / receipt image. Embedded at a controlled size when readable. */
  paymentProof?: { buffer: Buffer; mime: string } | null;
  createdAt: Date;
}

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_X = MARGIN;
const CONTENT_W = A4_WIDTH - MARGIN * 2;
const BOTTOM_LIMIT = A4_HEIGHT - MARGIN - 26;

/** Brand palette — indigo core with a violet accent. */
const BRAND_DEEP = "#312E81";
const ACCENT = "#7C3AED";
const INK = "#0F172A";
const INK_2 = "#475569";
const INK_3 = "#94A3B8";
const LINE = "#E2E8F0";
const SOFT = "#F8FAFC";
const SOFT_2 = "#EEF2FF";
const ON_BRAND = "#E0E7FF";

function refDate(d = new Date()): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * pdfkit's bundled type surface omits a few runtime mixins we rely on
 * (image sizing + page buffering). Reach them through this narrow, typed view
 * instead of scattering `any` across the file.
 */
interface PdfInternals {
  openImage(src: Buffer): { width: number; height: number };
  bufferedPageRange(): { start: number; count: number };
  switchToPage(page: number): void;
}
function internals(doc: PDFDocument): PdfInternals {
  return doc as unknown as PdfInternals;
}

/** A slim band shown on every page after the first, so continuations stay branded. */
function continuationBand(doc: PDFDocument, ref: string): void {
  doc.roundedRect(CONTENT_X, MARGIN - 20, CONTENT_W, 26, 8).fill(SOFT_2);
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(BRAND_DEEP)
    .text(`LANGUAGE HUB  ·  Registration ${ref}`, CONTENT_X + 12, MARGIN - 12, { lineBreak: false });
}

/** Page-break guard: returns a safe y, adding a branded page when needed. */
function ensureSpace(doc: PDFDocument, y: number, need: number, ref: string): number {
  if (y + need <= BOTTOM_LIMIT) return y;
  doc.addPage();
  continuationBand(doc, ref);
  return MARGIN + 22;
}

/** Rounded brand header with a monogram, brand line and the reference block. */
function header(
  doc: PDFDocument,
  opts: { course: string; tagline: string; ref: string; date: string },
  y: number
): number {
  const h = 94;
  doc.roundedRect(CONTENT_X, y, CONTENT_W, h, 16).fill(BRAND_DEEP);
  // accent stripe down the left edge
  doc.save();
  doc.roundedRect(CONTENT_X, y, 6, h, 3).fill(ACCENT);
  doc.restore();
  // monogram tile
  doc.roundedRect(CONTENT_X + 22, y + 20, 44, 44, 13).fill("#FFFFFF");
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(BRAND_DEEP)
    .text("LH", CONTENT_X + 22, y + 33, { width: 44, align: "center" });
  // brand line
  doc.font("Helvetica-Bold").fontSize(17).fillColor("#FFFFFF").text("LANGUAGE HUB", CONTENT_X + 78, y + 22, {
    lineBreak: false,
  });
  doc.font("Helvetica").fontSize(8.5).fillColor(ON_BRAND).text(opts.tagline, CONTENT_X + 78, y + 43, {
    lineBreak: false,
  });
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(ON_BRAND)
    .text("REGISTRATION SUMMARY", CONTENT_X + 78, y + 62, { characterSpacing: 1.6, lineBreak: false });
  // reference block (right)
  const rx = CONTENT_X + 160;
  const rw = CONTENT_W - 180;
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#FFFFFF")
    .text(opts.course, rx, y + 22, { width: rw, align: "right", lineBreak: false });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(ON_BRAND)
    .text(`REF  ${opts.ref}`, rx, y + 44, { width: rw, align: "right", lineBreak: false });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(ON_BRAND)
    .text(opts.date, rx, y + 58, { width: rw, align: "right", lineBreak: false });
  return y + h + 22;
}

/** Section heading: accent tick + tracked title + hairline. */
function sectionTitle(doc: PDFDocument, title: string, y: number): number {
  doc.roundedRect(CONTENT_X, y, 3.4, 12, 1.7).fill(ACCENT);
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(BRAND_DEEP)
    .text(title.toUpperCase(), CONTENT_X + 12, y - 1, { characterSpacing: 0.7, lineBreak: false });
  y += 16;
  doc.strokeColor(LINE).lineWidth(0.8).moveTo(CONTENT_X, y).lineTo(CONTENT_X + CONTENT_W, y).stroke();
  return y + 14;
}

/** Label / value row; advances by the real text height so nothing overlaps. */
function row(doc: PDFDocument, label: string, value: string, y: number, valueW = CONTENT_W - 160): number {
  doc
    .font("Helvetica")
    .fontSize(7.6)
    .fillColor(INK_3)
    .text(label.toUpperCase(), CONTENT_X + 2, y + 1.5, { width: 148, characterSpacing: 0.3 });
  doc.font("Helvetica").fontSize(9.7).fillColor(INK_2).text(value, CONTENT_X + 158, y, {
    width: valueW,
    align: "left",
  });
  const h = Math.max(doc.heightOfString(value, { width: valueW }), 12);
  return y + h + 8;
}

/** Draws an image in a soft rounded frame, scaled to fit the box. */
function framedImage(
  doc: PDFDocument,
  buffer: Buffer,
  x: number,
  y: number,
  maxW: number,
  maxH: number
): { height: number; ok: boolean } {
  let dims: { width: number; height: number };
  try {
    dims = internals(doc).openImage(buffer);
  } catch {
    return { height: 0, ok: false };
  }
  const scale = Math.min(maxW / dims.width, maxH / dims.height, 1);
  const w = Math.max(1, Math.round(dims.width * scale));
  const h = Math.max(1, Math.round(dims.height * scale));
  doc.save();
  doc.roundedRect(x, y, w + 12, h + 12, 10).fill(SOFT);
  doc.roundedRect(x, y, w + 12, h + 12, 10).lineWidth(0.8).strokeColor(LINE).stroke();
  doc.image(buffer, x + 6, y + 6, { width: w, height: h });
  doc.restore();
  return { height: h + 12, ok: true };
}

/** Footer on every page: confidentiality line + page count. */
function addFooters(doc: PDFDocument): void {
  const api = internals(doc);
  const range = api.bufferedPageRange();
  const total = range.count;
  for (let i = range.start; i < range.start + range.count; i += 1) {
    api.switchToPage(i);
    const fy = A4_HEIGHT - MARGIN + 4;
    doc.strokeColor(LINE).lineWidth(0.7).moveTo(CONTENT_X, fy - 12).lineTo(CONTENT_X + CONTENT_W, fy - 12).stroke();
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(INK_3)
      .text("Language Hub · Hub of Language Excellence · Confidential", CONTENT_X, fy, { lineBreak: false });
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(INK_3)
      .text(`Page ${i - range.start + 1} of ${total}`, CONTENT_X, fy, { width: CONTENT_W, align: "right", lineBreak: false });
  }
}

/**
 * Builds the polished registration summary PDF:
 *   1. brand header band (course, reference, date)
 *   2. student details beside the framed portrait
 *   3. academic background, study preferences, fee & payment
 *   4. embedded payment proof (scaled) when a readable image was uploaded
 *   5. institute payment accounts, declaration + signature
 *   6. confidential footer with page count on every page
 * Returns the completed file as a Buffer.
 */
export async function buildRegistrationPdf(input: RegistrationPdfInput): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
    margins: { top: 42, bottom: 42, left: MARGIN, right: MARGIN },
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

  const dateLabel = refDate(input.createdAt);
  doc.font("Helvetica").fillColor(INK);
  doc.rect(0, 0, A4_WIDTH, A4_HEIGHT).fill("#FFFFFF");

  let y = MARGIN + 4;
  y = header(doc, { course: input.course, tagline: input.tagline ?? "Hub of Language Excellence", ref: input.ref, date: dateLabel }, y);

  // ── student details, portrait on the right ──
  y = sectionTitle(doc, "Student details", y);
  const rowsTop = y;
  const photoColW = 108;
  const valueW = CONTENT_W - photoColW - 30;
  let rY = y;
  rY = row(doc, "Full name", input.name, rY, valueW);
  rY = row(doc, "Email", input.email, rY, valueW);
  rY = row(doc, "Phone", input.phone, rY, valueW);
  rY = row(doc, "Date of birth", input.dob, rY, valueW);
  rY = row(doc, "Address", input.address, rY, valueW);

  const photoX = CONTENT_X + CONTENT_W - photoColW;
  doc.font("Helvetica-Bold").fontSize(7).fillColor(INK_3).text("STUDENT PHOTO", photoX, rowsTop - 1, {
    width: photoColW,
    align: "center",
    characterSpacing: 0.6,
    lineBreak: false,
  });
  let photoBottom = rowsTop + 14;
  const drawn = input.photo
    ? framedImage(doc, input.photo.buffer, photoX, rowsTop + 12, photoColW - 12, 132)
    : { height: 0, ok: false };
  if (drawn.ok) {
    photoBottom = rowsTop + 12 + drawn.height;
  } else {
    doc.roundedRect(photoX, rowsTop + 12, photoColW, 132, 10).fill(SOFT);
    doc.roundedRect(photoX, rowsTop + 12, photoColW, 132, 10).lineWidth(0.8).strokeColor(LINE).stroke();
    doc.font("Helvetica").fontSize(8).fillColor(INK_3).text("Photo", photoX, rowsTop + 74, {
      width: photoColW,
      align: "center",
      lineBreak: false,
    });
    photoBottom = rowsTop + 12 + 132;
  }
  y = Math.max(rY, photoBottom) + 14;

  // ── academic background ──
  y = ensureSpace(doc, y, 90, input.ref);
  y = sectionTitle(doc, "Academic background", y);
  y = row(doc, "Highest qualification", input.education.qualification, y);
  y = row(doc, "Institution", input.education.institution, y);
  y = row(doc, "Year of passing", input.education.yearOfPassing, y);
  y += 8;

  // ── study preferences ──
  const studyLines: Array<[string, string]> = [
    ["Preferred study time", input.study.preferredTime],
    ["Modules to enhance", input.study.focusModules.join(", ") || "—"],
    ["Current level", input.study.level],
    ["Study hours per week", input.study.hoursPerWeek],
    ["Heard about Language Hub via", input.study.heardAbout],
  ];
  if (input.study.extras) studyLines.push(["Additional", input.study.extras]);
  y = ensureSpace(doc, y, 60, input.ref);
  y = sectionTitle(doc, "Study preferences", y);
  for (const [l, v] of studyLines) {
    y = ensureSpace(doc, y, 30, input.ref);
    y = row(doc, l, v, y);
  }
  y += 8;

  // ── fee & payment ──
  const paymentLines: Array<[string, string]> = [
    ["Payment method", input.payment.method],
    ["Programme fee", input.feeLabel],
    ["Fee note", input.feeNote],
  ];
  if (input.payment.receiptName) paymentLines.push(["Payment receipt", input.payment.receiptName]);
  if (input.payment.note) paymentLines.push(["Payment note", input.payment.note]);
  y = ensureSpace(doc, y, 60, input.ref);
  y = sectionTitle(doc, "Fee & payment", y);
  for (const [l, v] of paymentLines) {
    y = ensureSpace(doc, y, 30, input.ref);
    y = row(doc, l, v, y);
  }
  y += 6;

  // ── embedded payment proof (scaled to a sensible size) ──
  if (input.paymentProof) {
    y = ensureSpace(doc, y, 230, input.ref);
    y = sectionTitle(doc, "Payment proof", y);
    const capLabel = input.payment.receiptName ? `Uploaded: ${input.payment.receiptName}` : "Uploaded payment screenshot";
    doc.font("Helvetica").fontSize(8).fillColor(INK_3).text(capLabel, CONTENT_X + 2, y, { lineBreak: false });
    y += 14;
    const proof = framedImage(doc, input.paymentProof.buffer, CONTENT_X + 2, y, 190, 260);
    if (proof.ok) {
      y += proof.height + 14;
    } else {
      doc.font("Helvetica").fontSize(9).fillColor(INK_2).text("Payment proof attached with this email.", CONTENT_X + 2, y, {
        lineBreak: false,
      });
      y += 24;
    }
  }

  // ── payment accounts ──
  y = ensureSpace(doc, y, 150, input.ref);
  y = sectionTitle(doc, "Payment accounts", y);
  for (const acct of [PAYMENT_ACCOUNTS.easypaisa, PAYMENT_ACCOUNTS.bank]) {
    y = ensureSpace(doc, y, 80, input.ref);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND_DEEP).text(acct.label.toUpperCase(), CONTENT_X + 2, y, {
      characterSpacing: 0.5,
    });
    y += 15;
    for (const r of acct.rows) {
      y = row(doc, r.label, r.value, y);
    }
    y += 8;
  }

  // ── declaration + signature ──
  y = ensureSpace(doc, y, 150, input.ref);
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
  y += 44;

  doc.strokeColor(INK_3).lineWidth(0.8).moveTo(CONTENT_X + 2, y).lineTo(CONTENT_X + 230, y).stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(INK).text(input.name, CONTENT_X, y - 14, {
    width: 230,
    align: "left",
    lineBreak: false,
  });
  doc.font("Helvetica").fontSize(7.5).fillColor(INK_3).text(`Student signature · ${dateLabel}`, CONTENT_X, y + 6, {
    width: 230,
    align: "left",
    lineBreak: false,
  });
  doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND_DEEP).text("I AGREE", A4_WIDTH - MARGIN - 90, y - 14, {
    width: 90,
    align: "right",
    lineBreak: false,
  });

  addFooters(doc);
  doc.end();
  return done;
}
