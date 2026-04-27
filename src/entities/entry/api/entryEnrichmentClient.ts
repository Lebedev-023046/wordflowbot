import type { EntryEnrichment } from '../model/entry.types';

export interface EntryEnrichmentClient {
  enrich(text: string): Promise<EntryEnrichment>;
}
