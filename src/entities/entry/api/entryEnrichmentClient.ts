import type { EntryEnrichment } from '../model/entry.types';

export interface EnrichmentContext {
  level: string;
  studyLanguage: string;
  translationLanguage: string;
}

export const DEFAULT_ENRICHMENT_CONTEXT: EnrichmentContext = {
  level: 'B2',
  studyLanguage: 'en',
  translationLanguage: 'ru',
};

export interface EntryEnrichmentClient {
  enrich(text: string, context: EnrichmentContext): Promise<EntryEnrichment>;
}
