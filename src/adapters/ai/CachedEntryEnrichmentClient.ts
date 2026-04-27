import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { EntryEnrichmentClient } from '../../entities/entry/api/entryEnrichmentClient';
import type { EntryEnrichment } from '../../entities/entry/model/entry.types';
import type { Logger } from '../../shared/logging/logger';
import { isMissingFileError } from '../../shared/utils/errors';
import { normalizeEntryText } from '../../shared/utils/entryText';

interface CachedEntryEnrichmentClientParams {
  cacheFilePath: string;
  delegate: EntryEnrichmentClient;
  logger: Logger;
}

type CacheRecord = Record<string, EntryEnrichment>;

export class CachedEntryEnrichmentClient implements EntryEnrichmentClient {
  private cache: CacheRecord | null = null;
  private cacheLoadPromise: Promise<CacheRecord> | null = null;
  private readonly cacheFilePath: string;
  private readonly delegate: EntryEnrichmentClient;
  private readonly logger: Logger;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor({ cacheFilePath, delegate, logger }: CachedEntryEnrichmentClientParams) {
    this.cacheFilePath = cacheFilePath;
    this.delegate = delegate;
    this.logger = logger;
  }

  async enrich(text: string): Promise<EntryEnrichment> {
    const normalizedText = normalizeEntryText(text);
    const cached = await this.getCachedEntry(normalizedText);

    if (cached) {
      this.logger.info('Cache hit.', {
        cacheFilePath: this.cacheFilePath,
        text,
      });
      return cached;
    }

    this.logger.info('Cache miss.', {
      cacheFilePath: this.cacheFilePath,
      text,
    });

    const enrichment = await this.delegate.enrich(text);
    await this.storeCacheEntry(normalizedText, enrichment);

    this.logger.info('Cache stored.', {
      cacheFilePath: this.cacheFilePath,
      text,
    });

    return enrichment;
  }

  private async getCachedEntry(normalizedText: string): Promise<EntryEnrichment | null> {
    const cache = await this.loadCache();
    return cache[normalizedText] ?? null;
  }

  private async loadCache(): Promise<CacheRecord> {
    if (this.cache) {
      return this.cache;
    }

    if (!this.cacheLoadPromise) {
      this.cacheLoadPromise = this.readCacheFromDisk();
    }

    const cache = await this.cacheLoadPromise;
    this.cache = cache;

    return cache;
  }

  private async persistCache(cache: CacheRecord): Promise<void> {
    await mkdir(dirname(this.cacheFilePath), { recursive: true });
    await writeFile(this.cacheFilePath, JSON.stringify(cache, null, 2), 'utf8');
  }

  private async storeCacheEntry(
    normalizedText: string,
    enrichment: EntryEnrichment,
  ): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      const cache = await this.loadCache();
      cache[normalizedText] = enrichment;
      await this.persistCache(cache);
    });

    await this.writeQueue;
  }

  private async readCacheFromDisk(): Promise<CacheRecord> {
    try {
      const rawCache = await readFile(this.cacheFilePath, 'utf8');
      const parsed = JSON.parse(rawCache) as CacheRecord;

      this.logger.info('Cache loaded.', {
        cacheEntries: Object.keys(parsed).length,
        cacheFilePath: this.cacheFilePath,
      });

      return parsed;
    } catch (error) {
      if (isMissingFileError(error)) {
        return {};
      }

      this.logger.warn('Failed to read cache file. Starting empty.', {
        cacheFilePath: this.cacheFilePath,
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      });
      return {};
    }
  }
}
