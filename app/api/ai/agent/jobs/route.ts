import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getAiAgentJobsCollection, getAiAgentLogCollection } from "@/lib/db";
import { getAgentStatus } from "@/lib/ai/agent/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET — agent status + job queue + recent log feed (admin panel). */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const jobs = await getAiAgentJobsCollection();
  const logCol = await getAiAgentLogCollection();

  const [status, queue, recentLogs] = await Promise.all([
    getAgentStatus(),
    jobs.find({ status: { $in: ["queued", "running"] } }).sort({ createdAt: 1 }).limit(60).toArray(),
    logCol.find({}).sort({ createdAt: -1 }).limit(30).toArray(),
  ]);

  return NextResponse.json({
    status,
    queue: queue.map((j) => ({
      id: String(j._id),
      kind: j.kind,
      refKey: j.refKey,
      status: j.status,
      createdAt: j.createdAt.toISOString(),
    })),
    log: recentLogs.map((l) => ({
      id: String(l._id),
      kind: l.kind,
      action: l.action,
      refKey: l.refKey,
      detail: l.detail ?? null,
      ok: l.ok,
      offline: !!l.offline,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}