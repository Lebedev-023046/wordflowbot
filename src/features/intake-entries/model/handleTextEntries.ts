import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import { processEntry } from '../../../processes/entry-enrichment/model/processEntry';
import { parseEntries } from './parseEntries';
import { saveEntries } from './saveEntries';

interface HandleTextEntriesParams {
  entryRepository: EntryRepository;
  sessionId: string;
  text: string;
}

export type HandleTextEntriesResult =
  | { kind: 'empty' }
  | { kind: 'duplicatesOnly' }
  | { kind: 'saved'; count: number };

export function handleTextEntries({
  entryRepository,
  sessionId,
  text,
}: HandleTextEntriesParams): HandleTextEntriesResult {
  const parsedEntries = parseEntries(text);

  if (parsedEntries.length === 0) return { kind: 'empty' };

  const savedEntries = saveEntries({
    entryRepository,
    sessionId,
    texts: parsedEntries,
  });

  if (savedEntries.length === 0) return { kind: 'duplicatesOnly' };

  void Promise.allSettled(savedEntries.map((entry) => processEntry(entry, entryRepository)));

  return {
    kind: 'saved',
    count: savedEntries.length,
  };
}
