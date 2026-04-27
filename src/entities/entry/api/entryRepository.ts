import type { Entry, EntryStatus } from '../model/entry.types';

export interface EntryRepository {
  saveMany(entries: Entry[]): void;
  findBySessionId(sessionId: string): Entry[];
  existsInSession(sessionId: string, text: string): boolean;
  updateStatus(entryId: string, status: EntryStatus): void;
}
