import type { CompletedEntry, Entry } from '../model/entry.types';

export interface EntryRepository {
  deleteBySessionId(sessionId: string): Promise<void>;
  existsInSession(sessionId: string, text: string): Promise<boolean>;
  findCompletedBySessionIds(sessionIds: string[]): Promise<CompletedEntry[]>;
  findById(entryId: string): Promise<Entry | null>;
  findBySessionId(sessionId: string): Promise<Entry[]>;
  save(entry: Entry): Promise<void>;
  saveMany(entries: Entry[]): Promise<void>;
  update(entry: Entry): Promise<void>;
}
