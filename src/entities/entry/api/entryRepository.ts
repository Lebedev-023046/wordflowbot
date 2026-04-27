import type { Entry, EntryEnrichment, EntryStatus } from '../model/entry.types';

export interface EntryRepository {
  existsInSession(sessionId: string, text: string): boolean;
  findBySessionId(sessionId: string): Entry[];
  saveMany(entries: Entry[]): void;
  updateError(entryId: string, errorMessage: string): void;
  updateEnrichment(entryId: string, enrichment: EntryEnrichment): void;
  updateStatus(entryId: string, status: EntryStatus): void;
}
