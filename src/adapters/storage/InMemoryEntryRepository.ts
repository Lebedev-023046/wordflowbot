import type { EntryRepository } from '../../entities/entry/api/entryRepository';
import type { Entry, EntryEnrichment, EntryStatus } from '../../entities/entry/model/entry.types';

function normalizeEntryText(text: string): string {
  return text.trim().toLowerCase();
}

export class InMemoryEntryRepository implements EntryRepository {
  private entries = new Map<string, Entry[]>();

  saveMany(entries: Entry[]) {
    for (const entry of entries) {
      const sessionEntries = this.entries.get(entry.sessionId) ?? [];
      sessionEntries.push(entry);
      this.entries.set(entry.sessionId, sessionEntries);
    }
  }

  findBySessionId(sessionId: string) {
    return this.entries.get(sessionId) ?? [];
  }

  existsInSession(sessionId: string, text: string) {
    const normalizedText = normalizeEntryText(text);

    return this.findBySessionId(sessionId).some(
      (entry) => normalizeEntryText(entry.text) === normalizedText,
    );
  }

  updateStatus(entryId: string, status: EntryStatus) {
    for (const [sessionId, sessionEntries] of this.entries.entries()) {
      const nextEntries = sessionEntries.map((entry) =>
        entry.id === entryId ? { ...entry, status } : entry,
      );

      this.entries.set(sessionId, nextEntries);
    }
  }

  updateEnrichment(entryId: string, enrichment: EntryEnrichment) {
    for (const [sessionId, sessionEntries] of this.entries.entries()) {
      const nextEntries = sessionEntries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              errorMessage: null,
              examples: enrichment.examples,
              translation: enrichment.translation,
            }
          : entry,
      );

      this.entries.set(sessionId, nextEntries);
    }
  }

  updateError(entryId: string, errorMessage: string) {
    for (const [sessionId, sessionEntries] of this.entries.entries()) {
      const nextEntries = sessionEntries.map((entry) =>
        entry.id === entryId ? { ...entry, errorMessage } : entry,
      );

      this.entries.set(sessionId, nextEntries);
    }
  }
}
