import type { Entry } from '../../entities/entry/model/entry.types';
import type { ProcessEntriesResult } from '../../processes/entry-enrichment/model/process-entry.types';

export interface EnrichmentJobQueue {
  enqueue(entries: Entry[]): Promise<ProcessEntriesResult>;
}
