import type {
  ProcessEntriesParams,
  ProcessEntriesResult,
} from './process-entry.types';
import { processEntry } from './processEntry';

export async function processEntries({
  entries,
  entryEnrichmentClient,
  entryRepository,
}: ProcessEntriesParams): Promise<ProcessEntriesResult> {
  const results = await Promise.all(
    entries.map((entry) =>
      processEntry({
        entry,
        entryEnrichmentClient,
        entryRepository,
      }),
    ),
  );

  return results.reduce<ProcessEntriesResult>(
    (accumulator, result) => {
      if (result.kind === 'failed') {
        accumulator.failedCount += 1;
        accumulator.failureKinds.push(result.failureKind);
        return accumulator;
      }

      accumulator.succeeded.push({
        text: result.text,
        translation: result.translation,
      });

      return accumulator;
    },
    {
      failedCount: 0,
      failureKinds: [],
      succeeded: [],
    },
  );
}
