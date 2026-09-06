import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { runAgentRound, runWeeklyBlog, runManualWithdrawal, type AgentRoundResult } from "@/lib/ai/agent/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Autonomous AI admin agent — run entry point.
 *
 * GET  — background cron entry (guarded by AUTOMATION_SECRET) so the agent
 *        keeps working even when no admin panel is open.
 * POST — admin-triggered manual round (also available inside the panel).
 */
export async function GET(request: Request) {
  const secret = process.env.AUTOMATION_SECRET ?? "";
  if (secret) {
    const auth = request.headers.get("authorization");
    const headerTok =
      auth?.startsWith("Bearer ") ? auth.slice(7) : request.headers.get("x-automation-secret");
    const url = new URL(request.url);
    const queryTok = url.searchParams.get("secret");
    const given = [headerTok, queryTok].map((t) => (t ?? "").trim()).filter(Boolean)[0];
    const ok = given
      ? Buffer.from(given).length === Buffer.from(secret).length && Buffer.from(given).equals(Buffer.from(secret)) && given === secret
      : false;
    if (!ok) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry") === "1";
  try {
    const [round, blog] = await Promise.all([
      runAgentRound(12, dryRun),
      runWeeklyBlog(dryRun),
    ]);
    return NextResponse.json({ round, blog });
  } catch (err) {
    return NextResponse.json(
      { message: `Agent round failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const rl = await rateLimitDb(await clientKey(request, "agent-run"), 20, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ message: "Too many runs." }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as {
    withdrawal?: { amount?: unknown; method?: unknown; note?: unknown };
  };

  // Admin-instructed ledger withdrawal executed + audited by the agent.
  if (body.withdrawal && body.withdrawal.amount !== undefined) {
    const withdrawal = await runManualWithdrawal({
      amount: Number(body.withdrawal.amount),
      method: String(body.withdrawal.method ?? "cash").toLowerCase(),
      note: body.withdrawal.note ? String(body.withdrawal.note).slice(0, 300) : undefined,
    });
    return NextResponse.json({ withdrawal });
  }

  try {
    const round: AgentRoundResult = await runAgentRound(16);
    await runWeeklyBlog(false).catch(() => null);
    return NextResponse.json({ round });
  } catch (err) {
    return NextResponse.json(
      { message: `Agent round failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}