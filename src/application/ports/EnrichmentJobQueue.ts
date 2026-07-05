import type { EnrichmentContext } from '../../entities/entry/api/entryEnrichmentClient';
import type { Entry } from '../../entities/entry/model/entry.types';
import type { ProcessEntriesResult } from '../../processes/entry-enrichment/model/process-entry.types';

export interface EnrichmentJobQueue {
  enqueue(
    entries: Entry[],
    context: EnrichmentContext,
  ): Promise<ProcessEntriesResult>;
}
