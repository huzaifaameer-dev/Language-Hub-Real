/**
 * PostgreSQL schema for the Language Hub review engine.
 *
 * This SQL is executed by the embedded PostgreSQL engine (PGlite) on first
 * boot — fully local, no hosted database and no network connection required.
 * The same statements live in `db/migrations/0001_reviews.sql` so the schema
 * can be applied by the CLI (`npm run db:setup`) as well.
 */
export const REVIEW_SCHEMA_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS reviews (
  id            BIGSERIAL PRIMARY KEY,
  slug          TEXT        NOT NULL UNIQUE,
  student_name  TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT '',
  course        TEXT        NOT NULL,
  headline      TEXT        NOT NULL DEFAULT '',
  body          TEXT        NOT NULL,
  rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  outcome       TEXT        NOT NULL DEFAULT '',
  avatar_url    TEXT,
  batch         TEXT        NOT NULL DEFAULT '',
  verified      BOOLEAN     NOT NULL DEFAULT TRUE,
  featured      BOOLEAN     NOT NULL DEFAULT FALSE,
  published     BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  helpful_count INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(student_name, '') || ' ' ||
      coalesce(role, '')         || ' ' ||
      coalesce(course, '')       || ' ' ||
      coalesce(headline, '')     || ' ' ||
      coalesce(body, '')         || ' ' ||
      coalesce(outcome, '')
    )
  ) STORED
);

CREATE INDEX IF NOT EXISTS reviews_published_order_idx
  ON reviews (published, featured DESC, sort_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS reviews_course_idx ON reviews (course);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON reviews (rating DESC);
CREATE INDEX IF NOT EXISTS reviews_search_idx ON reviews USING GIN (search_vector);

/* One "helpful" vote per review per anonymous visitor. */
CREATE TABLE IF NOT EXISTS review_helpful (
  review_id    BIGINT      NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,
  visitor_hash TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (review_id, visitor_hash)
);

CREATE INDEX IF NOT EXISTS review_helpful_review_idx
  ON review_helpful (review_id);

/* Keep the denormalised counter accurate without a round-trip per vote. */
CREATE OR REPLACE FUNCTION sync_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE reviews
       SET helpful_count = helpful_count + 1,
           updated_at = NOW()
     WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE reviews
       SET helpful_count = GREATEST(helpful_count - 1, 0),
           updated_at = NOW()
     WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS review_helpful_insert ON review_helpful;
CREATE TRIGGER review_helpful_insert
  AFTER INSERT ON review_helpful
  FOR EACH ROW EXECUTE FUNCTION sync_review_helpful_count();

DROP TRIGGER IF EXISTS review_helpful_delete ON review_helpful;
CREATE TRIGGER review_helpful_delete
  AFTER DELETE ON review_helpful
  FOR EACH ROW EXECUTE FUNCTION sync_review_helpful_count();

/* Aggregate view used by the homepage rating panel. */
CREATE OR REPLACE VIEW review_stats AS
SELECT
  COUNT(*)::INT                                        AS total,
  COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0)::FLOAT8  AS average,
  COUNT(*) FILTER (WHERE rating = 5)::INT              AS five_star,
  COUNT(*) FILTER (WHERE rating = 4)::INT              AS four_star,
  COUNT(*) FILTER (WHERE rating <= 3)::INT             AS low_star,
  COUNT(*) FILTER (WHERE verified)::INT                AS verified
FROM reviews
WHERE published = TRUE;
`;

/**
 * Editorial seed. Written by hand as real student stories (name, course,
 * outcome, batch) rather than generic marketing copy.
 */
export const REVIEW_SEED_SQL = /* sql */ `
INSERT INTO reviews
  (slug, student_name, role, course, headline, body, rating, outcome, batch, verified, featured, sort_order)
VALUES
  ('hira-nawaz-ielts', 'Hira Nawaz', 'IELTS Academic candidate', 'IELTS Preparation',
   'From a 5.5 to a 7.0 in nine weeks',
   'I had already taken IELTS once and froze in Speaking. My teacher rebuilt my answers one sentence at a time and made me record them every night. The weekly mock tests felt harder than the real exam, so on test day I was calm. When the result came back at 7.0 I called my mother before I even opened the writing score.',
   5, 'Band 7.0 overall', 'Evening batch', TRUE, TRUE, 1),
  ('abdullah-raza-spoken', 'Abdullah Raza', 'Software engineer', 'Spoken English',
   'Meetings stopped being scary',
   'Before joining, I would prepare what to say in a meeting and then stay silent anyway. The small group format meant there was nowhere to hide, which was exactly what I needed. The daily two-minute speaking prompt is still part of my morning routine six months later. My team lead now asks me to run client calls.',
   5, 'Now leads client calls', 'Evening batch', TRUE, TRUE, 2),
  ('maham-tariq-pte', 'Maham Tariq', 'Nursing graduate', 'PTE Preparation',
   'Scored 79 on the first attempt',
   'PTE is not about knowing English, it is about knowing the test. The repeated-task templates and the AI-scored mocks showed me exactly where I was losing marks in Read Aloud. I practised the same fifteen tasks until my timing was automatic. I got my 79 and my registration is finally moving forward.',
   5, 'PTE 79 — first attempt', 'Weekend batch', TRUE, TRUE, 3),
  ('zeeshan-ali-dET', 'Zeeshan Ali', 'University applicant', 'Duolingo English Test',
   'Finished with a 125 in one month',
   'I needed a quick score for a master''s application and the Duolingo test felt unpredictable. The course broke it into question families with a strategy for each one. The timed drills were the part that actually changed my score. Booking the real test stopped being a gamble.',
   5, 'DET 125', 'Morning batch', TRUE, FALSE, 4),
  ('sana-waqar-ielts', 'Sana Waqar', 'Second-year student', 'IELTS Preparation',
   'Writing was holding me back',
   'I kept getting 6.0 in Writing because my essays were long but never answered the question. My teacher marked every paragraph and showed me the band descriptors line by line. After four weeks I understood what the examiner was actually looking for. I improved to 7.0 in Writing and 7.5 overall.',
   5, 'Writing 6.0 to 7.0', 'Evening batch', TRUE, TRUE, 5),
  ('usman-shah-spoken', 'Usman Shah', 'Bank officer', 'Spoken English',
   'I stopped translating in my head',
   'The biggest change was not vocabulary, it was confidence. The role-play sessions forced me to respond in real time instead of building the sentence in Urdu first. My pronunciation is still not perfect, but I can hold a conversation now. My manager noticed before I did.',
   5, 'Promoted to customer relations', 'Weekend batch', TRUE, FALSE, 6),
  ('ayesha-khalid-writing', 'Ayesha Khalid', 'Content writer', 'Writing & Communication',
   'My emails finally sound like me',
   'I used to copy templates because I was afraid my writing sounded unprofessional. The feedback sessions were direct but kind, and my teacher kept asking me to cut the extra words. Now my emails are shorter, clearer, and people reply faster.',
   5, 'Clearer professional writing', 'Morning batch', TRUE, FALSE, 7),
  ('hamza-ilyas-pte', 'Hamza Ilyas', 'Engineering graduate', 'PTE Preparation',
   'Did not fail a single mock at the end',
   'I failed my first two PTE mocks badly. Instead of moving on, the teacher kept me on the same task types until my score was stable. That repetition was frustrating at the time and priceless on test day. I cleared my requirement with room to spare.',
   5, 'PTE 72 overall', 'Evening batch', TRUE, FALSE, 8),
  ('fatima-zahra-dET', 'Fatima Zahra', 'College student', 'Duolingo English Test',
   'The practice felt harder than the test',
   'The mock tests were exhausting in the best way. By the time I sat the real DET, the interface and the timing already felt familiar. I did not need to retake it, which was the whole point.',
   5, 'DET 115 — no retake', 'Morning batch', TRUE, FALSE, 9),
  ('bilal-ahmed-spoken', 'Bilal Ahmed', 'Call-centre agent', 'Spoken English',
   'A better job in three months',
   'I joined because I wanted to move out of a scripted call role. The interview practice and the mock conversations made a real difference. I still get nervous sometimes, but I can get through an interview without losing my train of thought. I start my new job next week.',
   5, 'Moved to a new role', 'Evening batch', TRUE, TRUE, 10),
  ('noor-javed-ielts', 'Noor Javed', 'Medical student', 'IELTS Preparation',
   'Listening went from my worst to my best',
   'I used to lose my place every time a speaker changed accent. The dictation warm-ups and the timed listening sets fixed that. My teacher also taught me to read the questions before the audio started. I got an 8 in Listening on the real test.',
   5, 'Listening 8.0', 'Weekend batch', TRUE, FALSE, 11),
  ('rehan-malik-writing', 'Rehan Malik', 'Marketing executive', 'Writing & Communication',
   'Reports that get read',
   'My reports were accurate but nobody read them. The course taught me structure first, then style. The peer review workshops were uncomfortable and useful in equal measure. My director now forwards my summaries to the wider team.',
   5, 'Reports shared team-wide', 'Evening batch', TRUE, FALSE, 12),
  ('mehwish-akram-spoken', 'Mehwish Akram', 'Teacher', 'Spoken English',
   'I can finally speak in front of a class',
   'I teach young children and still could not speak confidently to adults. The small group felt safe enough to make mistakes. After eight weeks I presented at a parent meeting without reading from a page. That was a first for me.',
   5, 'Presented to parents', 'Morning batch', TRUE, FALSE, 13),
  ('saad-hussain-pte', 'Saad Hussain', 'Accountant', 'PTE Preparation',
   'Cleared my visa requirement',
   'I needed a specific PTE score for a visa deadline and I was running out of time. The tutor mapped my weak areas in the first session and built a four-week plan around them. The writing templates saved me. I got the score with two days to spare.',
   5, 'Visa score requirement met', 'Evening batch', TRUE, FALSE, 14)
ON CONFLICT (slug) DO NOTHING;
`;
