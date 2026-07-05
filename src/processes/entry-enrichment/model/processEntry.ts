import type {
  ProcessEntryParams,
  ProcessEntryResult,
} from './process-entry.types';
import { EnrichEntriesUseCase } from '../../../application/entries/commands/EnrichEntriesUseCase';
import { DEFAULT_ENRICHMENT_CONTEXT } from '../../../entities/entry/api/entryEnrichmentClient';

export async function processEntry({
  context = DEFAULT_ENRICHMENT_CONTEXT,
  entry,
  entryEnrichmentClient,
  entryRepository,
}: ProcessEntryParams): Promise<ProcessEntryResult> {
  const result = await new EnrichEntriesUseCase(
    entryEnrichmentClient,
    entryRepository,
    {
      error: () => undefined,
      info: () => undefined,
      warn: () => undefined,
    },
  ).execute([entry], context);

  if (result.succeeded.length > 0) {
    return {
      kind: 'succeeded',
      text: result.succeeded[0].text,
      translation: result.succeeded[0].translation,
    };
  }

  return {
    kind: 'failed',
    failureKind: result.failureKinds[0] ?? 'other',
    text: entry.text,
  };
}
