ALTER TABLE "ootd_records"
ADD COLUMN "sourceLookId" UUID;

CREATE INDEX "ootd_records_sourceLookId_idx" ON "ootd_records"("sourceLookId");
