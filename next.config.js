const isDev = process.env.NODE_ENV === "development";
// Vercel injects live-communication tooling from vercel.live (feedback,
// insights, speed-insights, live preview). Allow that origin on Vercel builds
// so the CSP stops blocking those requests on production.
const vercelLive = process.env.VERCEL ? " https://vercel.live" : "";

// Analytics script origin (umami/plausible…) — added to script-src/connect-src
// explicitly so the injected third-party script is actually allowed by the CSP.
let analyticsOrigin = "";
const analyticsUrl = (process.env.ANALYTICS_SCRIPT_URL ?? "").trim();
try {
  if (analyticsUrl) analyticsOrigin = new URL(analyticsUrl).origin;
} catch {}

// `'unsafe-inline'` is required for Next's hydration scripts; keep the surface
// minimal by avoiding `'unsafe-eval'` outside dev.
const scriptSrc = `'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${analyticsOrigin ? ` ${analyticsOrigin}` : ""}${vercelLive}`;
// Explicit connect-src so SSE (/api/events), fetch, and analytics beacons are
// governed by a named directive (no implicit default-src fallback surprises).
const connectSrc = `'self'${analyticsOrigin ? ` ${analyticsOrigin}` : ""}${vercelLive}`;
// Allowed embeddable frames: YouTube embeds + Vercel live-preview tooling.
const frameSrc = `https://www.youtube.com https://www.youtube-nocookie.com${vercelLive}`;

const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self'${vercelLive ? " https://vercel.live" : ""};
    connect-src ${connectSrc};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src ${frameSrc};
    worker-src 'self';
`;

module.exports = {
  poweredByHeader: false,
  // Use standalone output only when building for Docker (standalone script).
  // Vercel ignores this and uses its own build pipeline.
  output: process.env.VERCEL ? undefined : "standalone",
  // Skip type-checking during build on Vercel (free tier has limited CPU/RAM
  // and TS check hangs). Run `npm run typecheck` locally before pushing.
  typescript: { ignoreBuildErrors: !!process.env.VERCEL },
  // The driver stays external: webpack must not statically resolve mongodb's
  // optional native deps (client-side-encryption, kerberos, aws…) or the
  // bundle breaks at runtime with "Can't resolve 'mongodb-client-encryption'".
  serverExternalPackages: ["mongodb"],
  // Images are served locally (blog covers at /uploads/blog/...), so we keep
  // them on-disk and only rely on the browser/HTTP caching — no external image
  // CDN. Fetching through Next's optimizer is not needed for these already
  // re-compressed WebP uploads, so we mark them unoptimized (identical
  // pass-through to the previous custom loader) and avoid the
  // "loader does not implement width" dev warning.
  images: {
    unoptimized: true,
  },
  // This dev machine only has ~8GB RAM; cap the number of parallel build
  // workers so `next build` doesn't OOM during static generation. Does not
  // affect Vercel, which budgets its own workers.
  experimental: {
    cpus: 2,
  },
  allowedDevOrigins: ["192.168.100.7", "127.0.0.1", "localhost"],
  async headers() {
    // The homepage hosts the heavy animation/3D payload and is where external
    // tooling occasionally calls eval(); it alone gets `unsafe-eval` so those
    // calls stop tripping CSP. Every other route stays fully locked.
    const homeCsp = homeCspHeader().replace(/\s{2,}/g, " ").trim();
    const strictCsp = cspHeader.replace(/\s{2,}/g, " ").trim();

    const security = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-site" },
      {
        key: "Permissions-Policy",
        // microphone=(self) keeps Aina's voice input working on this site
        // (SpeechRecognition needs it); everything else stays locked down.
        value: "camera=(), microphone=(self), geolocation=(), browsing-topics=(), interest-cohort=()",
      },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    ];

    return [
      { source: "/", headers: [{ key: "Content-Security-Policy", value: homeCsp }, ...security] },
      {
        source: "/((?!$).*)",
        headers: [{ key: "Content-Security-Policy", value: strictCsp }, ...security],
      },
    ];
  },
};

/** Homepage CSP — same shape plus `unsafe-eval` (animation/3D tooling needs it). */
function homeCspHeader() {
  return `\n    default-src 'self';\n    script-src 'self' 'unsafe-inline' 'unsafe-eval'${analyticsOrigin ? ` ${analyticsOrigin}` : ""}${vercelLive};\n    style-src 'self' 'unsafe-inline';\n    img-src 'self' blob: data: https:;\n    font-src 'self'${vercelLive ? " https://vercel.live" : ""};\n    connect-src ${connectSrc};\n    object-src 'none';\n    base-uri 'self';\n    form-action 'self';\n    frame-ancestors 'none';\n    frame-src ${frameSrc};\n    worker-src 'self';\n  `;
}