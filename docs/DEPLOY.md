# Free Live Deploy — Step by Step (Vercel + MongoDB Atlas)

Goal: `language-hub` par aapka live link mile ga (e.g. `https://language-hub-xyz.vercel.app`)
Bss 3 free accounts chahiye: **GitHub**, **MongoDB Atlas**, **Vercel**.

> Secrets: `.env.local` kabhi GitHub pe push **nahi** karna (gitignore me hai ✓). Sab secrets Vercel ke dashboard me jaate hain.

---

## Part 1 — MongoDB Atlas (free 512 MB database)

1. `mongodb.com/cloud/atlas` → **Try Free / Start Free** → signup (Google se bhi chalega).
2. Create cluster → **M0 (FREE)** → region: jo bhi, name: `languagehub`.
3. **Network Access** → Add IP → **Allow access from anywhere** (`0.0.0.0/0`) → Confirm.
4. **Database Access** → Add new DB User → username + strong password → note password.
5. Cluster open → **Connect** → **Drivers** →
   Copy `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   Isko apne asli password ke saath store kar lo — ye `MONGODB_URI` hai.

---

## Part 2 — Repo ko GitHub pe push karo

Pehli dafa ho to GitHub pe new repo banao (empty, no README).

```bash
# ek dafa git identity (agar nahi ki)
git config --global user.name "ApKa Naam"
git config --global user.email "you@example.com"

# repo push
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git branch -M main
git push -u origin main
```

> Ye github actions cron bhi saath mein chale jate hain (jo background AI chala sakta hai).

---

## Part 3 — Vercel pe deploy (FREE Hobby)

1. `vercel.com` → **Sign up** with **GitHub** → continue.
2. **Add New → Project → Import** aapki repo.
3. Framework: **Next.js** (auto). Build Command: `npm run build` (vercel.json pehle se hai).
4. Click **Deploy** → thhora wait → mil jayega
   `https://<naam>.vercel.app`
5. **Settings → Environment Variables** (name → value):

| Key | Value | Kahan se |
|---|---|---|
| `AUTH_SECRET` | 32+ random chars | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `MONGODB_URI` | atlas uri (idar real password) | Part 1 se |
| `MONGODB_DB` | `languagehub` | |
| `NEXTAUTH_URL` | `https://<naam>.vercel.app` | jaisa link mila |
| `AUTH_URL` | `https://<naam>.vercel.app` | (same, safety) |
| `NEXT_PUBLIC_SITE_URL` | `https://<naam>.vercel.app` | |
| `TRUST_PROXY` | `1` | Vercel ke liye (real IP) |
| `ADMIN_EMAIL` | `huzaifa.ameer.2009@gmail.com` | admin seed |
| `ADMIN_PASSWORD` | strong | admin login |
| `ADMIN_ACCESS_CODE` | strong | admin access code |
| `AUTOMATION_SECRET` | random | cron guard |

Optional:
| `AI_API_KEY` | OpenAI/Groq key | chat/guide/agent live |
| `AI_MODEL` | `gpt-4o-mini` | default |
| `AI_DAILY_CAP` | `60` | cost guard |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Resend/Brevo free SMTP | emails |
| `WA_*` | WhatsApp Business token | WhatsApp |

6. Save → **Redeploy** (Deployments → ⋯ → Redeploy).

---

## Part 4 — Background AI cron (GitHub Actions)

Vercel Hobby pe in-process loop nahi chalta, isliye har 6h GitHub cron lagate hain:

1. `.github/workflows/automations.yml` me abhi:
   ```
   ACADEMY_PRODUCTION_URL="https://your-domain.example"
   ```
   Isko replace karo:
   ```
   ACADEMY_PRODUCTION_URL="https://<naam>.vercel.app"
   ```
2. Commit+push (`git add . && git commit -m "cron url" && git push`).
3. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - Name: `AUTOMATION_SECRET` → value: wahi jo Vercel me set kiya.

Ab agent har 6h background me applications/enrollments/proofs/blog process karta hai.

---

## Part 5 — Test karo (post-deploy)

1. `https://<naam>.vercel.app` open → homepage + Aina guide + Blog check.
2. Signup naya account → dashboard.
3. `/admin-panel` → email+password+access code → unlock.
4. Admin → **AI Operations Agent** tab → "Always active" + **Fortress shield** blocked-attacks card.
5. ZAP/security headers check kar sako (headers browser devtools me).

---

## Part 6 — Free email (optional)

- **Resend** (`resend.com`) free 100/day → `SMTP_HOST=smtp.resend.com`, `SMTP_USER=resend`, `SMTP_PASS=<API key>`, `MAIL_FROM="Language Hub <onboarding@resend.dev>"`.
- Nai to Brevo (300/day free) similar.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Missing AUTH_SECRET` | Vercel me `AUTH_SECRET` set + Redeploy |
| Login loop / session nahi | `NEXTAUTH_URL`/`AUTH_URL` bura hoga — sahi prod URL set + TRUST_PROXY=1 |
| Admin login nahi | `ADMIN_PASSWORD`+`ADMIN_ACCESS_CODE` set; fresh DB pe admin khud seed hoga |
| Homepage 200 lekin AI agent silent | GH Actions secret/url sab set → Actions tab me run manually (Run workflow) test karo |
| MongoDB connection | Atlas Network Access `0.0.0.0/0` + user/pass sahi |
| Cold start slow | Normal serverless; `GET /api/health` se warm up |
| ai_agent loop na chale | Vercel pe sirf cron — baqi puri tarah `Run workflow` |

## Cost watch (free hone ke bawajood)
- **Mongo Atlas M0**: free 512 MB — `reset-db.mjs` se saaf rakho.
- **AI (OpenAI/Groq)**: API hi billable — `AI_DAILY_CAP` = safety.
- **Vercel Hobby**: free — 100 GB bandwidth/month kafi hai.