import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";

const { GET, POST: nextAuthPost } = handlers;

// The credentials provider in this app is a pure email+password sign-in, so
// this endpoint is a brute-force target. Throttle per client to slow automated
// guessing while keeping the in-memory path as a fast fallback.
export const POST = async (request: NextRequest) => {
  const rl = await rateLimitDb(await clientKey(request, "nextauth-credentials"), 15, 60 * 1000);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({ message: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }
  return nextAuthPost(request);
};

export { GET };
