import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { Entry } from '../../../entities/entry/model/entry.types';
import { EntryFactory } from '../../../application/services/EntryFactory';

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
  const entryFactory = new EntryFactory();
  const uniqueTexts = texts.filter(
    (text) => !entryRepository.existsInSession(sessionId, text),
  );

  const entries: Entry[] = uniqueTexts.map((text) =>
    entryFactory.createPending(sessionId, text),
  );

  entryRepository.saveMany(entries);

  return entries;
}
