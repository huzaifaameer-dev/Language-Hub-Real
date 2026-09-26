import { cookies } from "next/headers";
import { auth } from "@/auth";
import { verifyClientId } from "@/lib/client-id";

export interface NewsActor {
  /** Stable identity used for likes + reactions + rate-limit dedupe. */
  actorId: string;
  name: string;
  image: string | null;
  clientId: string | null;
}

/**
 * Resolve who is acting on a news post/comment:
 * - signed-in user → stable `u:<userId>`
 * - anonymous visitor → stable signed `c:<clientId>` cookie when present
 * - otherwise a fresh random id (rare; cookie is set by middleware).
 */
export async function resolveNewsActor(): Promise<NewsActor> {
  try {
    const session = await auth();
    const user = session?.user;
    if (user?.id) {
      return {
        actorId: `u:${user.id}`,
        name: user.name || (user.email as string | undefined) || "Student",
        image: (user as { image?: string | null }).image ?? null,
        clientId: null,
      };
    }
  } catch {
    // Session layer unavailable → fall through to anonymous identity.
  }

  try {
    const store = await cookies();
    const clientId = await verifyClientId(store.get("lh_client")?.value);
    return {
      actorId: clientId ? `c:${clientId}` : `anon:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      name: "Guest",
      image: null,
      clientId,
    };
  } catch {
    return {
      actorId: `anon:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      name: "Guest",
      image: null,
      clientId: null,
    };
  }
}