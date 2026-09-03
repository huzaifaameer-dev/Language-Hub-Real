import { auth } from "@/auth";
import { getAdminSession } from "@/lib/admin-session";
import { subscribe, type LiveEvent } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();

// Server-Sent Events broadcaster. Pushes lightweight "something changed"
// signals to every open listener; the payloads carry NO user data (only an
// optional target userId so clients can skip unrelated work). Real data is
// always fetched through the authenticated JSON APIs.
export async function GET(request: Request) {
  // Gate the stream: open it only for an authenticated learner (NextAuth
  // session) or an authenticated admin (standalone admin cookie).
  const [session, admin] = await Promise.all([auth(), getAdminSession()]);
  if (!session?.user?.id && !admin?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();

  let closed = false;
  const send = (data: string) => {
    if (!closed) {
      writer.write(encoder.encode(data)).catch(() => {});
    }
  };

  send(`retry: 2000\n\n`);
  send(`data: ${JSON.stringify({ table: "poll", at: Date.now() })}\n\n`);

  // Server-side filtering: never stream another user's events onto a
  // learner's connection. Poll signals (value-less keepalives) go to everyone;
  // admins (who manage the whole catalog) get the full feed; a learner only
  // receives events explicitly targeted at their own userId.
  const viewerId = session?.user?.id ?? null;
  const isAdmin = !!admin?.email;
  const relevant = (ev: LiveEvent): boolean => {
    if (ev.table === "poll") return true;
    if (isAdmin) return true;
    if (!viewerId) return false;
    return ev.userId === viewerId;
  };

  const unsubscribe = subscribe((ev) => {
    if (relevant(ev)) send(`data: ${JSON.stringify(ev)}\n\n`);
  });

  // Keep the connection alive through idle proxies/proxies without activity.
  const ping = setInterval(() => send(": ping\n\n"), 15000);

  const abort = () => {
    closed = true;
    clearInterval(ping);
    unsubscribe();
    writer.close().catch(() => {});
  };

  if (request.signal.aborted) {
    abort();
  } else {
    request.signal.addEventListener("abort", abort, { once: true });
  }

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}