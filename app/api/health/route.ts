import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

async function pingDb(): Promise<boolean> {
  const timeout = new Promise<"TIMEOUT">((resolve) => setTimeout(() => resolve("TIMEOUT"), 1500));
  const ping = getDb().then((db) =>
    db.command({ ping: 1 }).then(
      () => "OK" as const,
      () => "DOWN" as const
    )
  );
  const result = await Promise.race([ping, timeout]);
  return result === "OK";
}

export async function GET() {
  const dbUp = await pingDb();

  return NextResponse.json(
    {
      status: dbUp ? "ok" : "degraded",
      db: dbUp ? "up" : "down",
      service: "language-hub",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { status: dbUp ? 200 : 503 }
  );
}