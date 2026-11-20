-- Language Hub · PostgreSQL review engine (migration 0001)
-- Applied automatically on first boot by lib/pg/client.ts and by `npm run db:setup`.

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

CREATE TABLE IF NOT EXISTS review_helpful (
  review_id    BIGINT      NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,
  visitor_hash TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (review_id, visitor_hash)
);
CREATE INDEX IF NOT EXISTS review_helpful_review_idx ON review_helpful (review_id);

CREATE OR REPLACE FUNCTION sync_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE reviews SET helpful_count = helpful_count + 1, updated_at = NOW()
     WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE reviews SET helpful_count = GREATEST(helpful_count - 1, 0), updated_at = NOW()
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
