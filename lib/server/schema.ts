/**
 * Language Hub — PostgreSQL schema (v2, greenfield).
 *
 * Applied idempotently by the embedded PGlite engine on first boot. All
 * identifiers are application-generated text UUIDs so the same statements run
 * unchanged against a hosted PostgreSQL server later (single connection-string
 * swap — the SQL is standard).
 *
 * Design notes
 * ────────────
 * • Every mutable table carries `created_at` / `updated_at`.
 * • Money is stored as integer PKR (no floating point).
 * • Flexible content (syllabus modules, outcomes, batches, credentials) is
 *   JSONB so the admin panel can edit it without migrations.
 * • Progress is normalised (chapters + chapter_progress + attendance) so
 *   reporting is a plain SQL aggregate, not a JSON scan.
 */

export const APP_SCHEMA_SQL = /* sql */ `
/* ─────────────────────────────── identity ─────────────────────────────── */
CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  name           TEXT        NOT NULL,
  email          TEXT        NOT NULL UNIQUE,
  phone          TEXT,
  password_hash  TEXT,
  role           TEXT        NOT NULL DEFAULT 'USER'
                 CHECK (role IN ('USER', 'ADMIN', 'TEACHER')),
  image          TEXT,
  avatar_data    TEXT,
  bio            TEXT,
  email_verified BOOLEAN     NOT NULL DEFAULT FALSE,
  disabled       BOOLEAN     NOT NULL DEFAULT FALSE,
  /* Bumped on password change / disable: every JWT + admin cookie issued
     before the bump is rejected, so a stolen session cannot outlive a reset. */
  token_version  INTEGER     NOT NULL DEFAULT 0,
  referral_code  TEXT        UNIQUE,
  referred_by    TEXT,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS users_role_idx    ON users (role);
CREATE INDEX IF NOT EXISTS users_created_idx ON users (created_at DESC);
CREATE INDEX IF NOT EXISTS users_name_lower_idx ON users (LOWER(name));

CREATE TABLE IF NOT EXISTS auth_tokens (
  id         TEXT        PRIMARY KEY,
  user_id    TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  kind       TEXT        NOT NULL CHECK (kind IN ('VERIFY_EMAIL', 'RESET_PASSWORD')),
  token_hash TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS auth_tokens_user_idx ON auth_tokens (user_id, kind);

/* ─────────────────────────────── catalogue ────────────────────────────── */
CREATE TABLE IF NOT EXISTS courses (
  id          TEXT        PRIMARY KEY,
  slug        TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  tagline     TEXT        NOT NULL DEFAULT '',
  description TEXT        NOT NULL DEFAULT '',
  duration    TEXT        NOT NULL DEFAULT '',
  schedule    TEXT        NOT NULL DEFAULT '',
  teacher     TEXT        NOT NULL DEFAULT 'Javaria Malik',
  fee         INTEGER     NOT NULL DEFAULT 0,
  accent_from TEXT        NOT NULL DEFAULT '#0a4e43',
  accent_to   TEXT        NOT NULL DEFAULT '#14a08c',
  icon        TEXT        NOT NULL DEFAULT 'book',
  modules     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  outcomes    JSONB       NOT NULL DEFAULT '[]'::jsonb,
  batches     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS courses_active_idx ON courses (active, sort_order);

CREATE TABLE IF NOT EXISTS chapters (
  id          TEXT    PRIMARY KEY,
  course_slug TEXT    NOT NULL REFERENCES courses (slug) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (course_slug, title)
);
CREATE INDEX IF NOT EXISTS chapters_course_idx ON chapters (course_slug, sort_order);

/* ───────────────────────────── admissions ─────────────────────────────── */
CREATE TABLE IF NOT EXISTS registrations (
  id             TEXT        PRIMARY KEY,
  ref            TEXT        NOT NULL UNIQUE,
  user_id        TEXT        REFERENCES users (id) ON DELETE SET NULL,
  course_key     TEXT        NOT NULL DEFAULT '',
  course_slug    TEXT        NOT NULL,
  full_name      TEXT        NOT NULL,
  email          TEXT        NOT NULL,
  phone          TEXT        NOT NULL,
  dob            TEXT,
  address        TEXT,
  city           TEXT,
  goal           TEXT,
  preferred_time TEXT,
  message        TEXT,
  details        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  send_copy      BOOLEAN     NOT NULL DEFAULT FALSE,
  status         TEXT        NOT NULL DEFAULT 'NEW'
                 CHECK (status IN ('NEW', 'CONTACTED', 'ENROLLED', 'REJECTED')),
  ref_code       TEXT,
  photo_path     TEXT,
  receipt_path   TEXT,
  pdf_path       TEXT,
  admin_note     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS registrations_user_idx    ON registrations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS registrations_status_idx  ON registrations (status, created_at DESC);
CREATE INDEX IF NOT EXISTS registrations_created_idx ON registrations (created_at DESC);

CREATE TABLE IF NOT EXISTS demo_bookings (
  id             TEXT        PRIMARY KEY,
  name           TEXT        NOT NULL,
  email          TEXT        NOT NULL,
  phone          TEXT,
  course_slug    TEXT        NOT NULL DEFAULT '',
  preferred_date TEXT,
  preferred_time TEXT,
  message        TEXT,
  status         TEXT        NOT NULL DEFAULT 'NEW'
                 CHECK (status IN ('NEW', 'SCHEDULED', 'DONE', 'CANCELLED')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS demo_bookings_status_idx ON demo_bookings (status, created_at DESC);

/* ───────────────────────────── learner progress ───────────────────────── */
CREATE TABLE IF NOT EXISTS enrollments (
  id          TEXT        PRIMARY KEY,
  user_id     TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_slug TEXT        NOT NULL,
  batch       TEXT        NOT NULL DEFAULT '',
  instructor  TEXT        NOT NULL DEFAULT '',
  status      TEXT        NOT NULL DEFAULT 'ACTIVE'
              CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS enrollments_user_idx ON enrollments (user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_one_active_idx
  ON enrollments (user_id, course_slug) WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS chapter_progress (
  id           TEXT        PRIMARY KEY,
  user_id      TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  chapter_id   TEXT        NOT NULL REFERENCES chapters (id) ON DELETE CASCADE,
  completed    BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, chapter_id)
);
CREATE INDEX IF NOT EXISTS chapter_progress_user_idx ON chapter_progress (user_id);

CREATE TABLE IF NOT EXISTS live_classes (
  id               TEXT        PRIMARY KEY,
  title            TEXT        NOT NULL,
  course_slug      TEXT        NOT NULL DEFAULT '',
  batch            TEXT        NOT NULL DEFAULT '',
  instructor       TEXT        NOT NULL DEFAULT '',
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER     NOT NULL DEFAULT 60,
  meeting_link     TEXT        NOT NULL DEFAULT '',
  platform         TEXT        NOT NULL DEFAULT 'Zoom',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS live_classes_time_idx ON live_classes (scheduled_at);

CREATE TABLE IF NOT EXISTS attendance (
  id        TEXT        PRIMARY KEY,
  user_id   TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  class_id  TEXT        NOT NULL REFERENCES live_classes (id) ON DELETE CASCADE,
  attended  BOOLEAN     NOT NULL DEFAULT FALSE,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, class_id)
);
CREATE INDEX IF NOT EXISTS attendance_user_idx ON attendance (user_id);

CREATE TABLE IF NOT EXISTS certificates (
  id                 TEXT        PRIMARY KEY,
  user_id            TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  certificate_id     TEXT        NOT NULL UNIQUE,
  student_name       TEXT        NOT NULL,
  course             TEXT        NOT NULL,
  batch              TEXT        NOT NULL DEFAULT '',
  issued_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completion_percent INTEGER     NOT NULL DEFAULT 100,
  signed_by          TEXT        NOT NULL DEFAULT 'Javaria Malik'
);
CREATE INDEX IF NOT EXISTS certificates_user_idx ON certificates (user_id);

/* ───────────────────────────── engagement ─────────────────────────────── */
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT        PRIMARY KEY,
  user_id    TEXT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL DEFAULT '',
  kind       TEXT        NOT NULL DEFAULT 'info',
  link       TEXT,
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, read, created_at DESC);

CREATE TABLE IF NOT EXISTS referrals (
  id               TEXT        PRIMARY KEY,
  user_id          TEXT        NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  code             TEXT        NOT NULL UNIQUE,
  discount_percent INTEGER     NOT NULL DEFAULT 10,
  redemptions      INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_redemptions (
  id              TEXT        PRIMARY KEY,
  referral_id     TEXT        NOT NULL REFERENCES referrals (id) ON DELETE CASCADE,
  used_by_user_id TEXT        REFERENCES users (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS referral_redemptions_ref_idx ON referral_redemptions (referral_id);

/* ───────────────────────────── public content ─────────────────────────── */
CREATE TABLE IF NOT EXISTS testimonials (
  id         TEXT        PRIMARY KEY,
  name       TEXT        NOT NULL,
  role       TEXT        NOT NULL DEFAULT '',
  course     TEXT        NOT NULL DEFAULT '',
  quote      TEXT        NOT NULL,
  outcome    TEXT        NOT NULL DEFAULT '',
  rating     SMALLINT    NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  image      TEXT,
  featured   BOOLEAN     NOT NULL DEFAULT FALSE,
  active     BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS testimonials_active_idx ON testimonials (active, featured DESC, sort_order);

/* Reviews students submit themselves through /student-reviews. Kept apart from
   the editorial review / testimonial pools until an admin publishes one. */
CREATE TABLE IF NOT EXISTS student_reviews (
  id             TEXT        PRIMARY KEY,
  name           TEXT        NOT NULL,
  email          TEXT        NOT NULL DEFAULT '',
  phone          TEXT        NOT NULL DEFAULT '',
  course         TEXT        NOT NULL DEFAULT '',
  batch          TEXT        NOT NULL DEFAULT '',
  teacher        TEXT        NOT NULL DEFAULT '',
  headline       TEXT        NOT NULL DEFAULT '',
  body           TEXT        NOT NULL,
  outcome        TEXT        NOT NULL DEFAULT '',
  rating         SMALLINT    NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  photo          TEXT,
  consent        BOOLEAN     NOT NULL DEFAULT FALSE,
  status         TEXT        NOT NULL DEFAULT 'NEW'
                 CHECK (status IN ('NEW', 'PUBLISHED', 'ARCHIVED')),
  published_slug TEXT,
  testimonial_id TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS student_reviews_status_idx
  ON student_reviews (status, created_at DESC);
CREATE INDEX IF NOT EXISTS student_reviews_created_idx
  ON student_reviews (created_at DESC);

CREATE TABLE IF NOT EXISTS team_members (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT '',
  headline    TEXT,
  credentials JSONB       NOT NULL DEFAULT '[]'::jsonb,
  bio         TEXT        NOT NULL DEFAULT '',
  focus       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  image       TEXT,
  ceo         BOOLEAN     NOT NULL DEFAULT FALSE,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS team_members_active_idx ON team_members (active, ceo DESC, sort_order);

CREATE TABLE IF NOT EXISTS feedback (
  id         TEXT        PRIMARY KEY,
  user_id    TEXT        REFERENCES users (id) ON DELETE SET NULL,
  name       TEXT        NOT NULL DEFAULT '',
  email      TEXT        NOT NULL DEFAULT '',
  category   TEXT        NOT NULL DEFAULT 'general',
  rating     SMALLINT    NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  subject    TEXT        NOT NULL DEFAULT '',
  message    TEXT        NOT NULL,
  contact_ok BOOLEAN     NOT NULL DEFAULT FALSE,
  status     TEXT        NOT NULL DEFAULT 'NEW'
             CHECK (status IN ('NEW', 'REVIEWED', 'ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON feedback (status, created_at DESC);

/* ───────────────────────────── platform ───────────────────────────────── */
CREATE TABLE IF NOT EXISTS placement_test_leads (
  id                 TEXT        PRIMARY KEY,
  name               TEXT        NOT NULL DEFAULT '',
  email              TEXT        NOT NULL,
  score              INTEGER,
  total              INTEGER,
  level              TEXT,
  recommended_course TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS placement_leads_created_idx ON placement_test_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS placement_leads_email_idx   ON placement_test_leads (LOWER(email));

CREATE TABLE IF NOT EXISTS ai_analyses (
  id         TEXT        PRIMARY KEY,
  kind       TEXT        NOT NULL DEFAULT 'placement',
  email      TEXT,
  name       TEXT,
  payload    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ai_analyses_created_idx ON ai_analyses (created_at DESC);

CREATE TABLE IF NOT EXISTS error_logs (
  id         TEXT        PRIMARY KEY,
  level      TEXT        NOT NULL DEFAULT 'error',
  scope      TEXT        NOT NULL DEFAULT 'client',
  message    TEXT        NOT NULL,
  stack      TEXT,
  url        TEXT,
  tag        TEXT,
  detail     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS error_logs_created_idx ON error_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS attack_events (
  id            TEXT        PRIMARY KEY,
  key           TEXT        NOT NULL DEFAULT 'unknown',
  kind          TEXT        NOT NULL,
  path          TEXT        NOT NULL DEFAULT '',
  blocked_until TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS attack_events_created_idx ON attack_events (created_at DESC);
CREATE INDEX IF NOT EXISTS attack_events_kind_idx    ON attack_events (kind, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          TEXT        PRIMARY KEY,
  actor_id    TEXT,
  actor_email TEXT,
  action      TEXT        NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  meta        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  ip          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx  ON audit_logs (action, created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* Rate-limit buckets survive server restarts and are shared by every route. */
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket     TEXT        NOT NULL,
  key        TEXT        NOT NULL,
  count      INTEGER     NOT NULL DEFAULT 0,
  reset_at   TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (bucket, key)
);

/* ──────────────────────────────── journal ─────────────────────────────── */
CREATE TABLE IF NOT EXISTS blog_posts (
  id           TEXT        PRIMARY KEY,
  slug         TEXT        NOT NULL UNIQUE,
  title        TEXT        NOT NULL,
  excerpt      TEXT        NOT NULL DEFAULT '',
  content      TEXT        NOT NULL DEFAULT '',
  cover_image  TEXT,
  category     TEXT        NOT NULL DEFAULT 'Journal',
  tags         JSONB       NOT NULL DEFAULT '[]'::jsonb,
  author       TEXT        NOT NULL DEFAULT 'Javaria Malik',
  author_role  TEXT        NOT NULL DEFAULT 'Founder & CEO',
  status       TEXT        NOT NULL DEFAULT 'DRAFT',
  featured     BOOLEAN     NOT NULL DEFAULT FALSE,
  read_minutes INTEGER     NOT NULL DEFAULT 4,
  views        INTEGER     NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON blog_posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_created_idx ON blog_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON blog_posts (category);

CREATE TABLE IF NOT EXISTS blog_comments (
  id         TEXT        PRIMARY KEY,
  post_id    TEXT        NOT NULL REFERENCES blog_posts (id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  approved   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS blog_comments_post_idx ON blog_comments (post_id, approved, created_at DESC);
CREATE INDEX IF NOT EXISTS blog_comments_created_idx ON blog_comments (created_at DESC);

/* ─────────────────────────── additive migrations ───────────────────────── */
/* CREATE TABLE IF NOT EXISTS never alters an existing table, so columns added
   after the first deploy are rolled forward here. Every statement is
   idempotent and safe to run on every boot (local PGlite and Neon alike). */
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
`;
