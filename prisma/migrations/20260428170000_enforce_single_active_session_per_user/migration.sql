WITH ranked_active_sessions AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "userId"
      ORDER BY "createdAt" DESC, id DESC
    ) AS row_number
  FROM "Session"
  WHERE "endedAt" IS NULL
)
UPDATE "Session"
SET
  "endedAt" = NOW(),
  "updatedAt" = NOW()
WHERE id IN (
  SELECT id
  FROM ranked_active_sessions
  WHERE row_number > 1
);

CREATE UNIQUE INDEX "Session_one_active_session_per_user_idx"
ON "Session" ("userId")
WHERE "endedAt" IS NULL;
