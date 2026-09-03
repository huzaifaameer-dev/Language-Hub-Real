const isDev = process.env.NODE_ENV === "development";

// Analytics script origin (umami/plausible…) — added to script-src/connect-src
// explicitly so the injected third-party script is actually allowed by the CSP.
let analyticsOrigin = "";
const analyticsUrl = (process.env.ANALYTICS_SCRIPT_URL ?? "").trim();
try {
  if (analyticsUrl) analyticsOrigin = new URL(analyticsUrl).origin;
} catch {}

// `'unsafe-inline'` is required for Next's hydration scripts; keep the surface
// minimal by avoiding `'unsafe-eval'` outside dev.
const scriptSrc = `'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${analyticsOrigin ? ` ${analyticsOrigin}` : ""}`;
// Explicit connect-src so SSE (/api/events), fetch, and analytics beacons are
// governed by a named directive (no implicit default-src fallback surprises).
const connectSrc = `'self'${analyticsOrigin ? ` ${analyticsOrigin}` : ""}`;

const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self';
    connect-src ${connectSrc};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    worker-src 'self';
`;

module.exports = {
  poweredByHeader: false,
  // Self-contained output so a Dockerfile can copy only the runtime trace
  // (server.js + traced node_modules) instead of the whole node_modules tree.
  // Vercel builds a separate deployment artefact and ignores this.
  output: "standalone",
  // The driver stays external: webpack must not statically resolve mongodb's
  // optional native deps (client-side-encryption, kerberos, aws…) or the
  // bundle breaks at runtime with "Can't resolve 'mongodb-client-encryption'".
  serverExternalPackages: ["mongodb"],
  // Images are served locally (blog covers at /uploads/blog/...), so we keep
  // them on-disk and only rely on the browser/HTTP caching — no external image
  // CDN. Fetching through Next's optimizer is not needed for these already
  // re-compressed WebP uploads.
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
  allowedDevOrigins: ["192.168.100.7", "127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\s{2,}/g, " ").trim(),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};