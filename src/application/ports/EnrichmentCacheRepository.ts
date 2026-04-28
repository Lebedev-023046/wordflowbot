import type { EntryEnrichment } from '../../entities/entry/model/entry.types';

export interface EnrichmentCacheKey {
  model: string;
  normalizedText: string;
  promptVersion: string;
}

export interface EnrichmentCacheRecord extends EnrichmentCacheKey {
  enrichment: EntryEnrichment;
  sourceText: string;
}

export interface EnrichmentCacheRepository {
  findByKey(key: EnrichmentCacheKey): Promise<EntryEnrichment | null>;
  save(record: EnrichmentCacheRecord): Promise<void>;
}
