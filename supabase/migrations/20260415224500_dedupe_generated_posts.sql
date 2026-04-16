-- Remove duplicate saved posts while keeping the newest copy for each
-- identical topic/content pair. This cleans up accidental repeat saves
-- without changing the normal save flow.
WITH ranked_posts AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY topic, content
      ORDER BY created_at DESC, id DESC
    ) AS row_num
  FROM generated_posts
)
DELETE FROM generated_posts
WHERE id IN (
  SELECT id
  FROM ranked_posts
  WHERE row_num > 1
);
