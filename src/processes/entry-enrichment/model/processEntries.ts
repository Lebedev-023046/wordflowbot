import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { Entry } from '../../../entities/entry/model/entry.types';
import { processEntry } from './processEntry';

type ProcessedEntryPreview = {
  text: string;
  translation: string;
};

export type ProcessEntriesResult = {
  failedCount: number;
  succeeded: ProcessedEntryPreview[];
};

interface ProcessEntriesParams {
  entries: Entry[];
  entryRepository: EntryRepository;
}

export async function processEntries({
  entries,
  entryRepository,
}: ProcessEntriesParams): Promise<ProcessEntriesResult> {
  const results = await Promise.all(entries.map((entry) => processEntry(entry, entryRepository)));

  return results.reduce<ProcessEntriesResult>(
    (accumulator, result) => {
      if (result.kind === 'failed') {
        accumulator.failedCount += 1;
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
      succeeded: [],
    },
  );
}
