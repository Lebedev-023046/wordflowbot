import type { Entry } from '../model/entry.types';

export interface EntryRepository {
  deleteBySessionId(sessionId: string): Promise<void>;
  existsInSession(sessionId: string, text: string): Promise<boolean>;
  findById(entryId: string): Promise<Entry | null>;
  findBySessionId(sessionId: string): Promise<Entry[]>;
  save(entry: Entry): Promise<void>;
  saveMany(entries: Entry[]): Promise<void>;
  update(entry: Entry): Promise<void>;
}
