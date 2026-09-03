import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { reportError } from "@/lib/reporting";

export const dynamic = "force-dynamic";

const ReportSchema = z.object({
  level: z.enum(["error", "warning"]).default("error"),
  scope: z.string().max(80).default("client"),
  message: z.string().min(1).max(2000),
  stack: z.string().max(8000).nullish(),
  url: z.string().max(500).nullish(),
  tag: z.string().max(60).nullish(),
});

export async function POST(request: Request) {
  const rl = await rateLimitDb(await clientKey(request, "report"), 40, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many reports.", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON." }, { status: 400 });
  }

  // Reject oversized payloads before z does the string truncation work.
  const raw = JSON.stringify(body);
  if (raw.length > 16_000) {
    return NextResponse.json({ message: "Payload too large." }, { status: 413 });
  }

  const parsed = ReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed." }, { status: 400 });
  }

  // Storage failures are swallowed inside reportError — always ack so the
  // client never retries floods.
  await reportError(parsed.data);

  return NextResponse.json({ ok: true });
}