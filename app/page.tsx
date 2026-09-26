import { Site } from "@/components/Site";

/** Homepage is static HTML cached at the CDN edge, revalidated every 30s.
 *  Visitors get it instantly — no per-request server/database round-trip. */
export const revalidate = 30;

export default function Home() {
  return <Site />;
}
