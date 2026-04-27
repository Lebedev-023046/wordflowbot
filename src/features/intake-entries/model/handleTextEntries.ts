import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { Entry } from '../../../entities/entry/model/entry.types';
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
  | { count: number; entries: Entry[]; kind: 'saved' };

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

  return {
    count: savedEntries.length,
    entries: savedEntries,
    kind: 'saved',
  };
}
