# Language Hub — Hub of Language Excellence

Production-grade web app for **Language Hub**, an online English-language
institute founded by **Ms. Javaria Malik**. It is a full learning-management
platform on top of a premium, scroll-driven marketing brand experience:

- **Marketing site** — cinematic one-page experience: kinetic intro, GSAP
  scroll choreography, pinned scenes, course cards, pricing, reviews, FAQ.
- **Aina — 3D voice guide** — a procedural Three.js mascot that greets visitors
  on load, answers with TTS + lip-sync, and takes mic (Chrome/Edge) or typed
  questions. Grounded by the same RAG knowledge base as the AI tutor.
- **Learning platform** — signup/login, course selection → secure multi-step
  registration form (per-course), student photo + payment-proof uploads with
  even stricter validation, automatic **PDF summary** emailed to the admin inbox
  and an optional copy to the student, 24-hour reply acknowledgment, live
  registration tracking, admin panel (registration desk, demo bookings,
  students, courses, news, testimonials, AI reports).
- **Admin panel** — one place to review course registrations (photo, receipt,
  generated PDF, WhatsApp/email links), move students through New → Contacted →
  Enrolled, plus demo bookings, students, courses, news and AI reports.
- **AI features** — RAG English tutor, placement-test analyser, essay/speaking
  feedback studio, and a weekly admin teacher-assistant agent. Every feature
  degrades to a deterministic **offline mode** when no LLM key is configured.

## Stack

- **Next.js 16 (webpack) + React 19 + TypeScript** (App Router)
- **Tailwind CSS 4** — all design tokens in `app/globals.css`
- **MongoDB** via the MongoDB Node driver (courses, users, applications,
  enrollments, payments, AI chunk store)
- **NextAuth v5** (beta) with the MongoDB adapter
- **Payments**: Stripe + **Konnect** (local PKR gateway) with a full admin
  ledger (deposits / withdrawals, overdraft guard)
- **AI SDK** (`ai` + `@ai-sdk/openai`) — SSE streaming tutor/guide; vector
  retrieval over the syllabus/FAQ/blog (Atlas `$vectorSearch` or in-process
  cosine)
- **3D**: `three` + `@react-three/fiber` (procedural mascot, no external assets)
- **Animations**: GSAP + ScrollTrigger, Framer Motion, Lenis smooth scroll
- **Lucide React** icons; fonts via `next/font` (Manrope, Inter, Playfair)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

> Turbopack is disabled (dev/build use `--webpack`) because this machine cannot
> load the `lightningcss` native binary under Turbopack.

### Environment

Copy `.env.example` → `.env.local` and fill in what you use. The app boots with
no secrets: AI/Mongo-dependent pages fall back gracefully (offline AI replies,
static fallback catalog).

- `AUTH_SECRET`, `MONGODB_URI` — required for login/dashboard/admin.
- `AI_API_KEY` (+ `AI_MODEL`, `AI_EMBEDDING_MODEL`, optional `AI_BASE_URL`) — unlocks
  the AI tutor, guide, placement analyser, feedback and weekly agent.
- `STRIPE_SECRET_KEY`, `KONNECT_SECRET_KEY`, `SMTP_*` — payments + transactional mail.
- `TRUST_PROXY=1` — set **only** behind a trusted reverse proxy; it switches rate
  limiting from the signed `lh_client` cookie to the real client IP.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build (webpack)
npm run start      # serve the production build
npm run start:standalone  # run the zero-node_modules standalone server
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest unit suite (tests/)
npm run test:e2e   # Playwright (e2e/) against a running dev/build server
npm run gen:api-docs # regenerate docs/API.md route inventory
```

**Data scripts** (safe for local/dev):

```bash
node scripts/seed-demo.mjs   # demo users / applications / enrollment / demo booking
node scripts/reset-db.mjs    # DROP ALL collections -> fresh bootstrap
```

## Documentation

- `RUNBOOK.md` — ops runbook: env matrix, deploy, cron, backups, monitoring.
- `docs/API.md` — 74-route HTTP API inventory (auto-generated).
- `docs/SCHEMA.md` — MongoDB collection reference.

## Project layout (highlights)

```
app/
  page.tsx              # marketing home (server component)
  api/                  # 60+ route handlers (auth, registration, courses,
                        #   payments, ai/*, guide, admin/*, webhooks…)
  dashboard/            # course selection → registration wizard + tracking
  admin-panel/          # gated admin UI (registration desk)
  courses/[slug]/       # per-course detail pages
  tutor/                # AI RAG English tutor
  ai-feedback/          # essay/speaking feedback studio
  placement-test/       # AI placement analyser
components/
  guide/                # Aina 3D voice guide (scene, speech, recognition, widget)
  ai/                   # tutor chat, feedback studio
  admin-panel/          # admin UI shell + registration desk + AI assistant
  dashboard/            # RegistrationWizard (5-step) + dashboard shell
  ... (hero, courses, footer, navigation, …)
lib/
  guide/                # guide persona + offline replies
  ai/                   # config, prompts, retrieve, vector-store, SSE, tutors
  registration-config.ts   # 4 courses, form config, payment accounts
  registration-pdf.ts      # pdfkit registration summary generator
  registration-storage.ts  # private/ media persistence (auth-guarded)
  rate-limit.ts         # sliding-window limiter (in-memory + Mongo)
  client-id.ts          # signed per-device identity cookie
  db.ts                 # Mongo collections
tests/                  # vitest: 21 files, 170+ tests
e2e/                    # Playwright: smoke, happy-path, admin
```

## Notes

- All published content uses only real Language Hub facts — no fabricated
  stats, reviews, contact details or pricing.
- `public/logo-transparent.png` is the official logo with its white background
  edge-feathered; `public/logo.jpg` is the untouched original.
- `three` is pinned to `0.182.0` because `@react-three/fiber@9.7` (stable) still
  constructs the deprecated `THREE.Clock` on newer three releases, which logs a
  deprecation warning.
- The intro, Aina's first greeting and all heavy animations respect
  `prefers-reduced-motion`; the intro is skippable.

### Ops / running notes

- **Start the production build:** `npm run build && npm run start`
  (`next start`) or `npm run start:standalone` for the zero-node_modules
  standalone output. `next start` warns under `output: standalone` — the
  standalone server is the intended production path.
- **Dev vs build share `.next`:** a running `next dev` can clobber production
  artifacts (`BUILD_ID`, `.next/dev/types`). Stop the dev server before
  `npm run build`, and if a build fails on stale generated type files, remove
  `.next` + `tsconfig.tsbuildinfo` and rebuild.
- **Frontend must restart to pick changes:** `next dev` compiles on the fly but
  server-only instrumentation (the autonomous AI interval, DB init) and
  `next.config.js` header changes (CSP/Permissions-Policy) require a full
  restart of the dev server.
- **Dependency watch list:** `next-auth` is on `^5.0.0-beta` and Next is on the
  16.x line — pin upgrades deliberately; `three` is pinned (see above) until
  `@react-three/fiber` ships Timer on stable.
- **Cron secrets:** the GitHub Actions timer calls `/api/automations` with the
  secret in an `Authorization: Bearer` header (never the URL).