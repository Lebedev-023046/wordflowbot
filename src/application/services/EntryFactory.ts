import type { Entry } from '../../entities/entry/model/entry.types';

export class EntryFactory {
  createPending(sessionId: string, text: string): Entry {
    return {
      id: crypto.randomUUID(),
      sessionId,
      text,
      examples: [],
      status: 'pending',
      translation: null,
      usage: null,
      errorMessage: null,
    };
  }
}
