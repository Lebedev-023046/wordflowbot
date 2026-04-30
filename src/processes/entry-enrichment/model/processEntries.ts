import { EnrichEntriesUseCase } from '../../../application/entries/commands/EnrichEntriesUseCase';
import type {
  ProcessEntriesParams,
  ProcessEntriesResult,
} from './process-entry.types';

export async function processEntries({
  entries,
  entryEnrichmentClient,
  entryRepository,
}: ProcessEntriesParams): Promise<ProcessEntriesResult> {
  return new EnrichEntriesUseCase(
    entryEnrichmentClient,
    entryRepository,
    {
      error: () => undefined,
      info: () => undefined,
      warn: () => undefined,
    },
    3,
  ).execute(entries);
}
