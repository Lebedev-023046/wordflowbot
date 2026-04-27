import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { Entry } from '../../../entities/entry/model/entry.types';

interface SaveEntriesParams {
  entryRepository: EntryRepository;
  sessionId: string;
  texts: string[];
}

export function saveEntries({
  entryRepository,
  sessionId,
  texts,
}: SaveEntriesParams): Entry[] {
  const uniqueTexts = texts.filter(
    (text) => !entryRepository.existsInSession(sessionId, text),
  );

  const entries: Entry[] = uniqueTexts.map((text) => ({
    id: crypto.randomUUID(),
    sessionId,
    text,
    examples: [],
    status: 'pending',
    translation: null,
    errorMessage: null,
  }));

  entryRepository.saveMany(entries);

  return entries;
}
