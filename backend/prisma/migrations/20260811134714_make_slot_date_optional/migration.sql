-- AlterTable
ALTER TABLE "service_slots" ALTER COLUMN "date" DROP NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "service_slots_providerId_date_idx";
DROP INDEX IF EXISTS "service_slots_serviceId_date_idx";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "service_slots_providerId_idx" ON "service_slots"("providerId");
CREATE INDEX IF NOT EXISTS "service_slots_serviceId_idx" ON "service_slots"("serviceId");
