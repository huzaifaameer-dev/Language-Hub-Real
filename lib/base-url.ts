/** Canonical absolute base URL for the deployed app (used across sitemap,
 *  robots, manifest, email links and structured data). */
export function appBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.BASE_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}