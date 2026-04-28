import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { Entry } from '../../../entities/entry/model/entry.types';
import { normalizeEntryText } from '../../../shared/utils/entryText';

export class InMemoryEntryRepository implements EntryRepository {
  private readonly entriesById = new Map<string, Entry>();
  private readonly entryIdsBySessionId = new Map<string, string[]>();

  async deleteBySessionId(sessionId: string) {
    const entryIds = this.entryIdsBySessionId.get(sessionId) ?? [];

    for (const entryId of entryIds) {
      this.entriesById.delete(entryId);
    }

    this.entryIdsBySessionId.delete(sessionId);
  }

  async save(entry: Entry) {
    this.entriesById.set(entry.id, cloneEntry(entry));

    const sessionEntryIds = this.entryIdsBySessionId.get(entry.sessionId) ?? [];

    if (!sessionEntryIds.includes(entry.id)) {
      sessionEntryIds.push(entry.id);
      this.entryIdsBySessionId.set(entry.sessionId, sessionEntryIds);
    }
  }

  async saveMany(entries: Entry[]) {
    for (const entry of entries) {
      await this.save(entry);
    }
  }

  async findById(entryId: string) {
    const entry = this.entriesById.get(entryId);
    return entry ? cloneEntry(entry) : null;
  }

  async findBySessionId(sessionId: string) {
    const entryIds = this.entryIdsBySessionId.get(sessionId) ?? [];
    return entryIds
      .map((entryId) => this.entriesById.get(entryId))
      .filter((entry): entry is Entry => entry !== undefined)
      .map((entry) => cloneEntry(entry));
  }

  async existsInSession(sessionId: string, text: string) {
    const normalizedText = normalizeEntryText(text);

    return (await this.findBySessionId(sessionId)).some(
      (entry) => normalizeEntryText(entry.text) === normalizedText,
    );
  }

  async update(entry: Entry) {
    if (!this.entriesById.has(entry.id)) {
      return;
    }

    this.entriesById.set(entry.id, cloneEntry(entry));
  }
}

function cloneEntry(entry: Entry): Entry {
  return {
    ...entry,
    examples: entry.examples.map((example) => ({ ...example })),
  };
}
