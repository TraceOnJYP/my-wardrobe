CREATE TYPE "OotdRecordType" AS ENUM ('daily', 'look');

ALTER TABLE "ootd_records"
ADD COLUMN "recordType" "OotdRecordType" NOT NULL DEFAULT 'daily';

CREATE INDEX "ootd_records_userId_recordType_idx"
ON "ootd_records"("userId", "recordType");
