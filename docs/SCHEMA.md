# Language Hub - Database Schema

Source of truth: `lib/db.ts` (Mongo collections + TypeScript interfaces). This
is a human summary of the collections and their key fields.

## Core business

| Collection | Key fields | Notes |
|---|---|---|
| `users` | name, email (unique), password (bcrypt), role (`USER`/`ADMIN`), phone?, emailVerified | Admin seeded from `ADMIN_EMAIL`/`ADMIN_PASSWORD` |
| `courses` | name (unique), fee, duration, schedule, batches[{name,time,seatsTotal}], modules[], active | Seeded from `FALLBACK_COURSES` on first boot |
| `applications` | userId, name, email, place, bio, course, message?, status (`PENDING`/`APPROVED`/`REJECTED`), `triage`?, `needsReview`?, `agentReason`?, `agentProcessedAt` | AI agent auto-decides on submit |
| `enrollments` | userId, applicationId, subjects[], batch, paymentMethod, paymentInstructions?, paymentProof?, status (`PENDING`/`AWAITING_PAYMENT`/`PROOF_SUBMITTED`/`ENROLLED`/`REJECTED`), `agentProcessedAt`?, `proofProcessedAt`? | Fee + proof flow |
| `payments` | enrollmentId?, userId, amount, currency, provider (`manual`/`stripe`/`konnect`), status, type (`DEPOSIT`/`WITHDRAWAL`), method, createdBy | Ledger: balance = deposits - withdrawals (overdraft-guarded) |
| `demo_bookings` | name, email, phone, preferredDate/Time, course, status (`PENDING`/`CONFIRMED`/`REJECTED`) | Auto-confirmed by agent |
| `testimonials` | name, role, quote, outcome, course, active, order | Seeded default set |

## Product

| Collection | Key fields |
|---|---|
| `blog_posts` | slug (unique), title, excerpt, content, coverImage, tags[], published, views, publishedAt |
| `student_progress` | userId+enrollmentId (unique), chapters[{title,completed}], attendance[], lastChapter |
| `live_classes` | enrollmentId, userId, course, batch, scheduledAt, meetingLink, platform, instructor |
| `certificates` | certificateId (unique), userId, enrollmentId, studentName, course, completionPercent, issuedAt |
| `assignments` | userId, enrollmentId, course, title, status (`DRAFT`/`SUBMITTED`/`GRADED`), feedbackThread[] |
| `referrals` / `referral_redeems` | code (unique) / ownerUserId, redeemedBy* |
| `whatsapp_leads` | phone, text, category, reply, flow{stage,course,batch,name}, thread[] |

## AI / Automation

| Collection | Key fields |
|---|---|
| `ai_chunks` | hash (unique), source, sourceId, kind, title, text, embedding? (vector RAG) |
| `ai_analyses` / `ai_feedback` / `ai_reports` | placement / feedback / weekly-agent outputs (offline flag) |
| `ai_agent_jobs` | refKey (unique), kind (`APPLICATION`/`ENROLLMENT`/`DEMO`/`BLOG`), status, decision{action,reason}, error? |
| `ai_agent_log` | immutable action trail (kind, action, refKey, ok, offline) |
| `ai_usage` | daily budget counters for public AI (TTL 8d) |
| `knowledge_drafts` | AI-suggested FAQ chunks awaiting admin approval |
| `session_recaps` | AI class recaps (summary, homework, per-student gaps) |
| `automation_sends` | dedup keys for email/WhatsApp nudges (unique) |

## Platform

| Collection | Notes |
|---|---|
| `notifications` | in-app + live-synced (userId, read) |
| `auth_tokens` | password-reset / email-verify (TTL) |
| `ratelimits` | sliding-window buckets (TTL) |
| `audit_log` | admin actions (actor, action, targetType) |
| `errors` | persisted server errors (from `onRequestError`) |
| `settings` | keyed app settings |
| `placement_test_leads` | public placement-test captures |
| `ai_feedback_history` | (see `ai_feedback` above) |

## Indexes & TTL

- Unique: `users.email`, `courses.name`, `blog_posts.slug`, `ai_chunks.hash`,
  `ai_agent_jobs.refKey`, `referrals.code`, `automation_sends.key`,
  `certificates.certificateId`, `payments.providerRef`
- Hard TTL: `ratelimits`, `auth_tokens`, `ai_usage`
- `ensureInit` composes all indexes + seeds idempotently at boot.