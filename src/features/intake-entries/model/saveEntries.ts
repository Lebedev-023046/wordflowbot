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
}: SaveEntriesParams): Promise<Entry[]> {
  return saveEntriesInternal({ entryRepository, sessionId, texts });
}

async function saveEntriesInternal({
  entryRepository,
  sessionId,
  texts,
}: SaveEntriesParams): Promise<Entry[]> {
  const entryFactory = new EntryFactory();
  const uniqueTexts: string[] = [];

  for (const text of texts) {
    if (!(await entryRepository.existsInSession(sessionId, text))) {
      uniqueTexts.push(text);
    }
  }

  const entries: Entry[] = uniqueTexts.map((text) =>
    entryFactory.createPending(sessionId, text),
  );

  await entryRepository.saveMany(entries);

  return entries;
}
