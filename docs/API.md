# Language Hub - HTTP API Reference

Auto-generated inventory of every App Router API route (`npm run gen:api-docs` regenerates it). Schemas live in `lib/validate.ts` and zod schemas in the route sources.

## Auth conventions
- **Admins**: standalone `hub_admin_token` cookie (enforced by `lib/admin-guard`).
- **Learners**: NextAuth JWT session (`auth()`).
- **Public AI** (`/api/guide`, `/api/ai/practice*`): rate-limited + daily quota via the `lh_client` identity.

## Routes (86 total)

```
/api/admin/ai/demo-brief
/api/admin/ai/query
/api/admin/ai/reports
/api/admin/ai/reports/[id]
/api/admin/ai/session-recap
/api/admin/ai/triage
/api/admin/ai/weekly-summary
/api/admin/analytics
/api/admin/applications
/api/admin/audit-log
/api/admin/courses
/api/admin/courses/[id]
/api/admin/demo-bookings
/api/admin/enrollments
/api/admin/growth/knowledge-drafts
/api/admin/growth/knowledge-drafts/[id]
/api/admin/login
/api/admin/logout
/api/admin/news
/api/admin/news/comments
/api/admin/news/comments/[id]
/api/admin/news/upload
/api/admin/payments
/api/admin/registrations
/api/admin/student-enroll
/api/admin/testimonials
/api/ai/agent/blog
/api/ai/agent/blog/publish
/api/ai/agent/jobs
/api/ai/agent/run
/api/ai/feedback
/api/ai/feedback/history
/api/ai/placement-analyze
/api/ai/practice
/api/ai/practice/feedback
/api/ai/tutor
/api/ai/tutor/index
/api/applications
/api/auth/[...nextauth]
/api/auth/forgot
/api/auth/reset
/api/auth/verify
/api/automations
/api/courses
/api/dashboard
/api/dashboard/assignments
/api/dashboard/certificates
/api/dashboard/classes
/api/dashboard/progress
/api/demo-bookings
/api/enrollments
/api/enrollments/payment-proof
/api/events
/api/guide
/api/health
/api/me
/api/news
/api/news/[slug]
/api/news/[slug]/comments
/api/news/[slug]/comments/[commentId]/like
/api/news/[slug]/reaction
/api/notifications
/api/payments
/api/payments/checkout
/api/payments/konnect
/api/payments/konnect-callback
/api/payments/success
/api/payments/webhook
/api/placement-test
/api/profile
/api/profile/avatar
/api/profile/avatar/[userId]
/api/profile/export
/api/profile/password
/api/proof/[id]
/api/referral
/api/referral/redeem
/api/register
/api/registrations
/api/registrations/media/[id]
/api/report
/api/security/event
/api/stats
/api/success-stories
/api/testimonials
/api/whatsapp/webhook
```

## Groups

- **/admin** — 26 route(s)
- **/ai** — 11 route(s)
- **/applications** — 1 route(s)
- **/auth** — 4 route(s)
- **/automations** — 1 route(s)
- **/courses** — 1 route(s)
- **/dashboard** — 5 route(s)
- **/demo-bookings** — 1 route(s)
- **/enrollments** — 2 route(s)
- **/events** — 1 route(s)
- **/guide** — 1 route(s)
- **/health** — 1 route(s)
- **/me** — 1 route(s)
- **/news** — 5 route(s)
- **/notifications** — 1 route(s)
- **/payments** — 6 route(s)
- **/placement-test** — 1 route(s)
- **/profile** — 5 route(s)
- **/proof** — 1 route(s)
- **/referral** — 2 route(s)
- **/register** — 1 route(s)
- **/registrations** — 2 route(s)
- **/report** — 1 route(s)
- **/security** — 1 route(s)
- **/stats** — 1 route(s)
- **/success-stories** — 1 route(s)
- **/testimonials** — 1 route(s)
- **/whatsapp** — 1 route(s)
