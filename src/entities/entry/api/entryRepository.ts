import type { Entry } from '../model/entry.types';

export interface EntryRepository {
  existsInSession(sessionId: string, text: string): boolean;
  findById(entryId: string): Entry | null;
  findBySessionId(sessionId: string): Entry[];
  save(entry: Entry): void;
  saveMany(entries: Entry[]): void;
  update(entry: Entry): void;
}
