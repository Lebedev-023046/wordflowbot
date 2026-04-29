-- CreateEnum
CREATE TYPE "EntryUsage" AS ENUM ('A', 'B', 'C');

-- AlterTable
ALTER TABLE "Entry"
ADD COLUMN "usage" "EntryUsage";

-- AlterTable
ALTER TABLE "EnrichmentCache"
ADD COLUMN "usage" "EntryUsage";
