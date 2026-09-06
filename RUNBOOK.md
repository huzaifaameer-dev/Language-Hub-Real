# Language Hub — Operations Runbook

Everything needed to run, deploy, monitor and recover the platform. Read this
before touching production.

---

## 1. Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| MongoDB | 6.x (local, Atlas, or Docker) |
| npm | 9+ |

- **Turbopack is off** (webpack builds only) because `lightningcss` native
  binary fails under Turbopack on some machines.
- `three` is pinned to `0.182.0` (see README "Version notes") — keep the pin
  until `@react-three/fiber` ships Timer on stable.

---

## 2. Environment variables

Copy `.env.example` → `.env.local`. Feature matrix:

| Group | Required for | Vars |
|---|---|---|
| Auth/auth | login, dashboard, admin | `AUTH_SECRET`, `MONGODB_URI`, `MONGODB_DB` |
| Admin | admin panel | `ADMIN_EMAIL`, `ADMIN_PASSWORD` (seeds the admin on first boot) |
| Email | transactional mail + automations | `SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM` |
| Payments | online checkout / ledger | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`, `KONNECT_*` |
| WhatsApp | lead funnel + nudges | `WA_TOKEN`, `WA_WEBHOOK_TOKEN`, `WA_PHONE_NUMBER`, `WA_API_URL` |
| AI | tutor/guide/agent/blog | `AI_API_KEY`, `AI_MODEL`, `AI_EMBEDDING_MODEL`, `AI_BASE_URL`, `AI_VECTOR_MODE` |
| AI autonomy | agent behavior | `AI_AGENT_AUTO` (0 = flag-only), `AI_DAILY_CAP`, `AI_AGENT_BLOG` |
| Automation cron | background jobs | `AUTOMATION_SECRET` (sent via `Authorization: Bearer`) |
| Hardening | trusted reverse proxy | `TRUST_PROXY=1` (only behind a real proxy) |

> **Secrets never go in the URL.** Cron sends `AUTOMATION_SECRET` in the
> `Authorization` header (`.github/workflows/automations.yml`).

---

## 3. Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

> A running `next dev` **shares `.next` with builds**. Stop it before
> `npm run build`, and if a build fails on stale generated types, remove
> `.next` + `tsconfig.tsbuildinfo` and rebuild.

**First-boot bootstrapping** runs automatically via `instrumentation.ts`:
indexes, seeded course catalog, default testimonials, admin account, and the
**autonomous AI agent loop** (`[ai-agent] autonomous admin running (every 10m)`).

---

## 4. Data seed / reset

```bash
node scripts/seed-demo.mjs    # demo users/apps/enrollment/demo booking
node scripts/reset-db.mjs     # DROP ALL collections (fresh start)
```

`reset-db.mjs` is destructive — run it only on local/dev. The app re-seeds
indexes/courses/testimonials/admin on the next request.

---

## 5. Production build & run

```bash
npm run build
npm run start                 # next start
npm run start:standalone      # node .next/standalone/server.js (recommended) 
```

`output: "standalone"` is set in `next.config.js`, so `.next/standalone`
contains a self-contained server for the Docker image.

---

## 6. Background automation

Two layers, **both optional but recommended**:

1. **In-process AI agent interval** (always on while a server is running):
   - fires ~15s after boot, then every `AI_AGENT_INTERVAL_MS` (default 10 min).
2. **External cron** (survives restarts / serverless):
   - GitHub Actions `.github/workflows/automations.yml` (every 6h) and/or a
     scheduler hitting `GET /api/automations` + `GET /api/ai/agent/run` with
     `Authorization: Bearer $AUTOMATION_SECRET`.
   - `ENABLE_AUTOMATION_INTERVAL=true` enables the in-process email-automation
     tick that also calls `/api/automations`.

The agent clears: applications → enrollments → payment proofs → demo bookings
(+ weekly AI blog if `AI_AGENT_BLOG=1`). Every action is written to
`ai_agent_log` + `audit_log`.

---

## 7. Monitoring & alerting

| What | Where |
|---|---|
| Liveness | `GET /api/health` (`{ status, db }`) |
| Agent activity | `[ai-agent] round: …` server logs + `/api/ai/agent/jobs` (admin) |
| Errors | `app/instrumentation.ts` `onRequestError` → `/lib/reporting` → alert webhook (env `alert.*`) |
| Analytics | `SiteAnalytics` + optional `ANALYTICS_SCRIPT_URL` (CSP-auto-allowed) |

---

## 8. Backup & restore (MongoDB)

```bash
# Backup
mongodump --uri="$MONGODB_URI" --db=languagehub --out=./backups/$(date +%F)
# Restore
mongorestore --uri="$MONGODB_URI" --db=languagehub ./backups/<date>/languagehub
```

Collections of special note: `users`, `payments` (ledger), `enrollments`,
`courses`, `blog_posts`, `ai_chunks`, `automation_sends`. TTL indexes prune
`ratelimits`, `auth_tokens`, and `ai_usage` automatically.

---

## 9. Deployment checklist

- [ ] `.env.local` (or equivalent) fully populated per the matrix above
- [ ] Reverse proxy configured; set `TRUST_PROXY=1` **and** ensure
      `x-forwarded-for` is only writable by the proxy
- [ ] `AUTOMATION_SECRET` set + used in cron (header, not URL)
- [ ] HTTPS + the security headers from `next.config.js` verified
- [ ] Cron registered (GitHub Actions / Vercel / scheduler)
- [ ] `WA_WEBHOOK_TOKEN` set → webhook now **requires** `X-Hub-Signature-256`
- [ ] Smoke: `npm run typecheck && npm run lint && npm test && npx playwright test`
- [ ] Staging pass of the full AI flow (apply → approve → pay → proof → enroll)

---

## 10. Common issues

| Symptom | Fix |
|---|---|
| `[auth][error] MissingSecret` | Set `AUTH_SECRET` |
| `/api/auth/session` returns HTML 404 | Restart server after deploy; proxy excludes Auth.js routes by design |
| Build fails on `.next/dev/types/*.d.ts` | Stop dev server, remove `.next` + `tsconfig.tsbuildinfo`, rebuild |
| Bot/abuse on WhatsApp | Ensure `WA_WEBHOOK_TOKEN` set (HMAC gate + per-number limits) |
| `three` deprecation warning | Expected; pinned to `0.182.0` |