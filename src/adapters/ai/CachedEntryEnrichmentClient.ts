import type { EnrichmentCacheRepository } from '../../application/ports/EnrichmentCacheRepository';
import {
  DEFAULT_ENRICHMENT_CONTEXT,
  type EnrichmentContext,
  type EntryEnrichmentClient,
} from '../../entities/entry/api/entryEnrichmentClient';
import type { EntryEnrichment } from '../../entities/entry/model/entry.types';
import type { Logger } from '../../shared/logging/logger';
import { normalizeEntryText } from '../../shared/utils/entryText';

interface CachedEntryEnrichmentClientParams {
  cacheRepository: EnrichmentCacheRepository;
  delegate: EntryEnrichmentClient;
  logger: Logger;
  model: string;
  promptVersion: string;
}

export class CachedEntryEnrichmentClient implements EntryEnrichmentClient {
  private readonly cacheRepository: EnrichmentCacheRepository;
  private readonly delegate: EntryEnrichmentClient;
  private readonly inFlightRequests = new Map<
    string,
    Promise<EntryEnrichment>
  >();
  private readonly logger: Logger;
  private readonly model: string;
  private readonly promptVersion: string;

  constructor({
    cacheRepository,
    delegate,
    logger,
    model,
    promptVersion,
  }: CachedEntryEnrichmentClientParams) {
    this.cacheRepository = cacheRepository;
    this.delegate = delegate;
    this.logger = logger;
    this.model = model;
    this.promptVersion = promptVersion;
  }

  async enrich(
    text: string,
    context: EnrichmentContext = DEFAULT_ENRICHMENT_CONTEXT,
  ): Promise<EntryEnrichment> {
    const normalizedText = normalizeEntryText(text);
    const cacheKey = this.getCacheKey(normalizedText, context);
    const cached = await this.cacheRepository.findByKey({
      level: context.level,
      model: this.model,
      normalizedText,
      promptVersion: this.promptVersion,
      studyLanguage: context.studyLanguage,
    });

    if (cached) {
      this.logger.info('Cache hit.', {
        model: this.model,
        promptVersion: this.promptVersion,
        text,
      });
      return cached;
    }

    const inFlightRequest = this.inFlightRequests.get(cacheKey);

    if (inFlightRequest) {
      this.logger.info('Cache request deduplicated.', {
        model: this.model,
        promptVersion: this.promptVersion,
        text,
      });
      return inFlightRequest;
    }

    this.logger.info('Cache miss.', {
      model: this.model,
      promptVersion: this.promptVersion,
      text,
    });

    const request = this.loadAndCacheEnrichment(text, normalizedText, context);
    this.inFlightRequests.set(cacheKey, request);

    try {
      return await request;
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
  }

  private getCacheKey(
    normalizedText: string,
    context: EnrichmentContext,
  ): string {
    return `${normalizedText}:${this.model}:${this.promptVersion}:${context.studyLanguage}:${context.level}`;
  }

  private async loadAndCacheEnrichment(
    text: string,
    normalizedText: string,
    context: EnrichmentContext,
  ): Promise<EntryEnrichment> {
    const enrichment = await this.delegate.enrich(text, context);

    await this.cacheRepository.save({
      enrichment,
      level: context.level,
      model: this.model,
      normalizedText,
      promptVersion: this.promptVersion,
      sourceText: text,
      studyLanguage: context.studyLanguage,
    });

    this.logger.info('Cache stored.', {
      model: this.model,
      promptVersion: this.promptVersion,
      text,
    });

    return enrichment;
  }
}
