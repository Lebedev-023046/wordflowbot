-- CreateTable
CREATE TABLE "EnrichmentCache" (
    "id" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "examplesJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrichmentCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnrichmentCache_normalizedText_idx" ON "EnrichmentCache"("normalizedText");

-- CreateIndex
CREATE UNIQUE INDEX "EnrichmentCache_normalizedText_model_promptVersion_key" ON "EnrichmentCache"("normalizedText", "model", "promptVersion");
