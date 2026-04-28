import { ProcessEntriesUseCase } from '../../../application/use-cases/ProcessEntriesUseCase';
import type {
  ProcessEntriesParams,
  ProcessEntriesResult,
} from './process-entry.types';

export async function processEntries({
  entries,
  entryEnrichmentClient,
  entryRepository,
}: ProcessEntriesParams): Promise<ProcessEntriesResult> {
  return new ProcessEntriesUseCase(
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
