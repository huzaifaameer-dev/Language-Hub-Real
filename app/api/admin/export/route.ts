import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/server/admin";
import { q } from "@/lib/server/pg";
import { csvResponse, toCsv, type CsvColumn } from "@/lib/csv";

export const dynamic = "force-dynamic";

/**
 * Admin CSV exports for the front-desk queues.
 *
 * Only whitelisted datasets exist, each with an explicit column list — an
 * `ORDER BY`/`LIMIT` is baked in so a huge table can never be dumped into
 * memory, and private blobs (photo/receipt/PDF paths) are never included.
 */
interface Dataset<T> {
  file: string;
  sql: string;
  columns: CsvColumn<T>[];
}

const DATASETS: Record<string, Dataset<Record<string, unknown>>> = {
  registrations: {
    file: "admissions",
    sql: `SELECT ref, full_name, email, phone, course_slug, city, preferred_time,
                 goal, status, admin_note, created_at
            FROM registrations
           ORDER BY created_at DESC
           LIMIT 5000`,
    columns: [
      { header: "Reference", value: (r) => r.ref },
      { header: "Name", value: (r) => r.full_name },
      { header: "Email", value: (r) => r.email },
      { header: "Phone", value: (r) => r.phone },
      { header: "Programme", value: (r) => r.course_slug },
      { header: "City", value: (r) => r.city },
      { header: "Preferred time", value: (r) => r.preferred_time },
      { header: "Goal", value: (r) => r.goal },
      { header: "Status", value: (r) => r.status },
      { header: "Admin note", value: (r) => r.admin_note },
      { header: "Received", value: (r) => r.created_at },
    ],
  },
  demos: {
    file: "demo-bookings",
    sql: `SELECT name, email, phone, course_slug, preferred_date, preferred_time,
                 message, status, created_at
            FROM demo_bookings
           ORDER BY created_at DESC
           LIMIT 5000`,
    columns: [
      { header: "Name", value: (r) => r.name },
      { header: "Email", value: (r) => r.email },
      { header: "Phone", value: (r) => r.phone },
      { header: "Programme", value: (r) => r.course_slug },
      { header: "Preferred date", value: (r) => r.preferred_date },
      { header: "Preferred time", value: (r) => r.preferred_time },
      { header: "Message", value: (r) => r.message },
      { header: "Status", value: (r) => r.status },
      { header: "Booked", value: (r) => r.created_at },
    ],
  },
  leads: {
    file: "placement-leads",
    sql: `SELECT name, email, score, total, level, recommended_course, created_at
            FROM placement_test_leads
           ORDER BY created_at DESC
           LIMIT 5000`,
    columns: [
      { header: "Name", value: (r) => r.name },
      { header: "Email", value: (r) => r.email },
      { header: "Score", value: (r) => r.score },
      { header: "Total", value: (r) => r.total },
      { header: "Level", value: (r) => r.level },
      { header: "Recommended course", value: (r) => r.recommended_course },
      { header: "Taken", value: (r) => r.created_at },
    ],
  },
  feedback: {
    file: "feedback",
    sql: `SELECT name, email, category, rating, subject, message, status, created_at
            FROM feedback
           ORDER BY created_at DESC
           LIMIT 5000`,
    columns: [
      { header: "Name", value: (r) => r.name },
      { header: "Email", value: (r) => r.email },
      { header: "Category", value: (r) => r.category },
      { header: "Rating", value: (r) => r.rating },
      { header: "Subject", value: (r) => r.subject },
      { header: "Message", value: (r) => r.message },
      { header: "Status", value: (r) => r.status },
      { header: "Received", value: (r) => r.created_at },
    ],
  },
};

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const datasetKey = (new URL(request.url).searchParams.get("dataset") ?? "").toLowerCase();
  const dataset = DATASETS[datasetKey];
  if (!dataset) {
    return NextResponse.json(
      { message: `Unknown dataset. Use one of: ${Object.keys(DATASETS).join(", ")}.` },
      { status: 400 }
    );
  }

  const rows = await q<Record<string, unknown>>(dataset.sql);
  const csv = toCsv(rows, dataset.columns);
  const stamp = new Date().toISOString().slice(0, 10);

  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.export_downloaded",
    targetType: "export",
    targetId: datasetKey,
    meta: { dataset: datasetKey, rows: rows.length },
  }).catch(() => null);

  return csvResponse(csv, `language-hub-${dataset.file}-${stamp}.csv`);
}
