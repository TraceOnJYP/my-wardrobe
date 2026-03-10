ALTER TABLE "ootd_records"
ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "wearDate"
      ORDER BY "createdAt" ASC, id ASC
    ) - 1 AS row_num
  FROM "ootd_records"
  WHERE "deletedAt" IS NULL
)
UPDATE "ootd_records" AS records
SET "displayOrder" = ordered.row_num
FROM ordered
WHERE records.id = ordered.id;

CREATE INDEX "ootd_records_userId_wearDate_displayOrder_idx"
ON "ootd_records"("userId", "wearDate", "displayOrder");
