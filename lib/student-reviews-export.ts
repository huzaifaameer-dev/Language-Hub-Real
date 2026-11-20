import PDFDocument from "pdfkit";

import type { StudentReview } from "@/lib/server/studentReviews";

const DEEP = "#0b4f45";
const TEAL = "#0d6a58";
const CORAL = "#d9532f";
const INK = "#10231f";
const INK_2 = "#44615a";
const INK_3 = "#8ba19b";
const LINE = "#dcefe9";
const SOFT = "#f3fbf8";

const MARGIN = 44;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - MARGIN - 30;

/** pdfkit's typings omit these runtime mixins. */
interface PdfInternals {
  bufferedPageRange(): { start: number; count: number };
  switchToPage(page: number): void;
}
function internals(doc: PDFDocument): PdfInternals {
  return doc as unknown as PdfInternals;
}

function stamp(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function csvCell(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function studentReviewsToCsv(
  reviews: StudentReview[],
  photos: Map<string, string> = new Map()
): string {
  const header = [
    "id",
    "name",
    "email",
    "phone",
    "course",
    "batch",
    "teacher",
    "rating",
    "headline",
    "review",
    "outcome",
    "status",
    "consent",
    "submittedAt",
    "publishedSlug",
    "photoDataUri",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const r of reviews) {
    lines.push(
      [
        r.id,
        r.name,
        r.email,
        r.phone,
        r.course,
        r.batch,
        r.teacher,
        r.rating,
        r.headline,
        r.body,
        r.outcome,
        r.status,
        r.consent ? "yes" : "no",
        stamp(r.createdAt),
        r.publishedSlug ?? "",
        photos.get(r.id) ?? "",
      ]
        .map(csvCell)
        .join(",")
    );
  }
  // BOM keeps Excel from mangling apostrophes and non-ASCII names.
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function decodePhoto(review: StudentReview, raw: string | undefined): Buffer | null {
  if (!raw) return null;
  const match = /^data:image\/(?:png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(raw);
  if (!match) return null;
  try {
    return Buffer.from(match[1], "base64");
  } catch {
    return null;
  }
}

function stars(rating: number): string {
  return "★".repeat(Math.max(0, Math.min(5, rating))) + "☆".repeat(Math.max(0, 5 - rating));
}

/**
 * Printable archive of every submitted review — the offline backup the team can
 * keep before moving hosts. Photos are embedded when they are PNG/JPEG (the
 * browser form always uploads JPEG); WebP assets fall back to initials.
 */
export async function studentReviewsToPdf(
  reviews: StudentReview[],
  photos: Map<string, string>
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    bufferPages: true,
    info: {
      Title: "Language Hub — student reviews archive",
      Author: "Language Hub",
      Subject: "Submitted student reviews",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array)));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const generated = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  /* ── cover band ─────────────────────────────────────────────────────── */
  doc.rect(0, 0, PAGE_W, 118).fill(DEEP);
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#8fe0c6")
    .text("LANGUAGE HUB", MARGIN, 34, { characterSpacing: 2 });
  doc
    .font("Helvetica-Bold")
    .fontSize(23)
    .fillColor("#ffffff")
    .text("Student reviews archive", MARGIN, 50);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#c9e9e1")
    .text(
      `${reviews.length} review${reviews.length === 1 ? "" : "s"} · exported ${generated}`,
      MARGIN,
      85
    );

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(INK_3)
    .text(
      "Keep this file safe. It is a complete offline copy of every review submitted through the website, including pending ones.",
      MARGIN,
      134,
      { width: CONTENT_W }
    );

  let y = 162;

  const ensure = (need: number) => {
    if (y + need <= BOTTOM) return;
    doc.addPage();
    y = MARGIN + 8;
  };

  if (reviews.length === 0) {
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(INK)
      .text("No reviews have been submitted yet.", MARGIN, y);
  }

  for (const review of reviews) {
    const photo = decodePhoto(review, photos.get(review.id));
    const photoSize = photo ? 64 : 0;
    const textX = MARGIN + (photo ? photoSize + 14 : 0);
    const textW = CONTENT_W - (photo ? photoSize + 14 : 0);

    doc.font("Helvetica").fontSize(9);
    const bodyHeight = doc.heightOfString(review.body, { width: textW });
    const metaHeight = 12;
    const headlineHeight = review.headline ? 15 : 0;
    const outcomeHeight = review.outcome ? 14 : 0;
    const contactHeight = review.email || review.phone ? 12 : 0;
    const blockHeight =
      Math.max(photoSize, 16 + metaHeight + headlineHeight + bodyHeight + outcomeHeight + contactHeight) +
      26;

    ensure(blockHeight);

    const top = y;

    if (photo) {
      doc.save();
      doc.roundedRect(MARGIN, top, photoSize, photoSize, 10).clip();
      try {
        doc.image(photo, MARGIN, top, { cover: [photoSize, photoSize], align: "center", valign: "center" });
      } catch {
        doc.rect(MARGIN, top, photoSize, photoSize).fill(SOFT);
      }
      doc.restore();
      doc
        .roundedRect(MARGIN, top, photoSize, photoSize, 10)
        .lineWidth(1)
        .strokeColor(LINE)
        .stroke();
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(INK)
      .text(review.name, textX, top, { width: textW, lineBreak: false });

    const badge = review.status === "PUBLISHED" ? "ON WEBSITE" : review.status;
    doc
      .font("Helvetica-Bold")
      .fontSize(6.5)
      .fillColor(review.status === "PUBLISHED" ? TEAL : CORAL)
      .text(badge, textX, top + 1, { width: textW, align: "right", characterSpacing: 0.8 });

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(INK_3)
      .text(
        `${review.course || "Course not set"}${review.batch ? ` · ${review.batch}` : ""} · ${stars(
          review.rating
        )} · ${stamp(review.createdAt)}`,
        textX,
        top + 16,
        { width: textW }
      );

    let cursor = top + 16 + metaHeight;

    if (review.headline) {
      doc
        .font("Helvetica-BoldOblique")
        .fontSize(9.5)
        .fillColor(INK)
        .text(`“${review.headline}”`, textX, cursor, { width: textW });
      cursor += headlineHeight;
    }

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(INK_2)
      .text(review.body, textX, cursor, { width: textW });
    cursor += bodyHeight;

    if (review.outcome) {
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(TEAL)
        .text(`OUTCOME · ${review.outcome}`, textX, cursor + 2, {
          width: textW,
          characterSpacing: 0.4,
        });
      cursor += outcomeHeight;
    }

    if (review.email || review.phone) {
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(INK_3)
        .text(
          [review.email, review.phone].filter(Boolean).join("  ·  "),
          textX,
          cursor + 2,
          { width: textW }
        );
      cursor += contactHeight;
    }

    y = Math.max(cursor + 14, top + blockHeight);
    doc
      .moveTo(MARGIN, y)
      .lineTo(PAGE_W - MARGIN, y)
      .lineWidth(0.8)
      .strokeColor(LINE)
      .stroke();
    y += 16;
  }

  /* ── footer on every page ───────────────────────────────────────────── */
  const range = internals(doc).bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    internals(doc).switchToPage(i);
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(INK_3)
      .text(
        `Language Hub · student reviews archive · page ${i + 1} of ${range.count}`,
        MARGIN,
        PAGE_H - 30,
        { width: CONTENT_W, align: "center", lineBreak: false }
      );
  }

  doc.end();
  return done;
}
