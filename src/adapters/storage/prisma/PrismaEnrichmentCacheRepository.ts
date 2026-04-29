import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  EnrichmentCacheKey,
  EnrichmentCacheRecord,
  EnrichmentCacheRepository,
} from '../../../application/ports/EnrichmentCacheRepository';
import type {
  EntryEnrichment,
  EntryExample,
  EntryUsage,
} from '../../../entities/entry/model/entry.types';
import type { Logger } from '../../../shared/logging/logger';
import { isMissingDatabaseTableError } from '../../../shared/utils/errors';

export class PrismaEnrichmentCacheRepository implements EnrichmentCacheRepository {
  private readonly prisma: PrismaClient;
  private readonly logger: Logger;
  private cacheTableUnavailable = false;

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  async findByKey(key: EnrichmentCacheKey): Promise<EntryEnrichment | null> {
    if (this.cacheTableUnavailable) {
      return null;
    }

    try {
      const record = await this.prisma.enrichmentCache.findUnique({
        where: {
          normalizedText_model_promptVersion: {
            model: key.model,
            normalizedText: key.normalizedText,
            promptVersion: key.promptVersion,
          },
        },
      });

      return record ? mapCacheExamplesToEnrichment(record) : null;
    } catch (error) {
      if (isMissingDatabaseTableError(error, 'EnrichmentCache')) {
        this.disableCacheTable(error);
        return null;
      }

      throw error;
    }
  }

  async save(record: EnrichmentCacheRecord): Promise<void> {
    if (this.cacheTableUnavailable) {
      return;
    }

    try {
      await this.prisma.enrichmentCache.upsert({
        create: {
          examplesJson: record.enrichment.examples as Prisma.InputJsonValue,
          id: crypto.randomUUID(),
          model: record.model,
          normalizedText: record.normalizedText,
          promptVersion: record.promptVersion,
          sourceText: record.sourceText,
          translation: record.enrichment.translation,
          usage: record.enrichment.usage,
        },
        update: {
          examplesJson: record.enrichment.examples as Prisma.InputJsonValue,
          sourceText: record.sourceText,
          translation: record.enrichment.translation,
          usage: record.enrichment.usage,
        },
        where: {
          normalizedText_model_promptVersion: {
            model: record.model,
            normalizedText: record.normalizedText,
            promptVersion: record.promptVersion,
          },
        },
      });
    } catch (error) {
      if (isMissingDatabaseTableError(error, 'EnrichmentCache')) {
        this.disableCacheTable(error);
        return;
      }

      throw error;
    }
  }

  private disableCacheTable(error: unknown): void {
    if (this.cacheTableUnavailable) {
      return;
    }

    this.cacheTableUnavailable = true;
    this.logger.warn(
      'EnrichmentCache table is missing. Falling back to uncached enrichment until migrations are applied.',
      {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      },
    );
  }
}

function mapCacheExamplesToEnrichment(record: {
  examplesJson: Prisma.JsonValue;
  translation: string;
  usage?: EntryUsage | null;
}): EntryEnrichment {
  return {
    examples: parseExamples(record.examplesJson),
    translation: record.translation,
    usage: record.usage ?? 'B',
  };
}

function parseExamples(json: Prisma.JsonValue): EntryExample[] {
  if (!Array.isArray(json)) {
    return [];
  }

  return json.flatMap((item) => {
    if (!isEntryExample(item)) {
      return [];
    }

    return [item];
  });
}

function isEntryExample(value: Prisma.JsonValue): value is EntryExample {
  return (
    typeof value === 'object' &&
    value !== null &&
    'text' in value &&
    'translation' in value &&
    typeof value.text === 'string' &&
    typeof value.translation === 'string'
  );
}
