-- Store sources as a JSON array instead of a Postgres jsonb[] array so
-- the API can insert and read plain JavaScript arrays consistently.
ALTER TABLE generated_posts
  ALTER COLUMN sources TYPE JSONB
  USING CASE
    WHEN sources IS NULL THEN NULL
    ELSE to_jsonb(sources)
  END;
