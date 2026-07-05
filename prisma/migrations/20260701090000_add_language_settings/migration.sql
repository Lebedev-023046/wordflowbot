-- AlterTable
ALTER TABLE "Session"
ADD COLUMN "studyLanguage" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN "translationLanguage" TEXT NOT NULL DEFAULT 'ru';

-- AlterTable
ALTER TABLE "EnrichmentCache"
ADD COLUMN "studyLanguage" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN "level" TEXT NOT NULL DEFAULT 'B2';

-- DropIndex
DROP INDEX "EnrichmentCache_normalizedText_model_promptVersion_key";

-- CreateIndex
CREATE UNIQUE INDEX "EnrichmentCache_normalizedText_model_promptVersion_studyLanguage_level_key" ON "EnrichmentCache"("normalizedText", "model", "promptVersion", "studyLanguage", "level");

-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" BIGINT NOT NULL,
    "studyLanguage" TEXT NOT NULL DEFAULT 'en',
    "translationLanguage" TEXT NOT NULL DEFAULT 'ru',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "LanguageLevel" (
    "userId" BIGINT NOT NULL,
    "language" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'B2',

    CONSTRAINT "LanguageLevel_pkey" PRIMARY KEY ("userId","language")
);
