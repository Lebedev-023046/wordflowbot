-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "status" "EntryStatus" NOT NULL,
    "translation" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryExample" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "EntryExample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_userId_endedAt_idx" ON "Session"("userId", "endedAt");

-- CreateIndex
CREATE INDEX "Entry_sessionId_idx" ON "Entry"("sessionId");

-- CreateIndex
CREATE INDEX "Entry_sessionId_status_idx" ON "Entry"("sessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_sessionId_normalizedText_key" ON "Entry"("sessionId", "normalizedText");

-- CreateIndex
CREATE INDEX "EntryExample_entryId_idx" ON "EntryExample"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "EntryExample_entryId_sortOrder_key" ON "EntryExample"("entryId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryExample" ADD CONSTRAINT "EntryExample_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
