import type { Entry, EntryEnrichment } from './entry.types';

export function completeEntry(entry: Entry, enrichment: EntryEnrichment): Entry {
  return {
    ...entry,
    errorMessage: null,
    examples: enrichment.examples,
    status: 'completed',
    translation: enrichment.translation,
  };
}

export function failEntry(entry: Entry, errorMessage: string): Entry {
  return {
    ...entry,
    errorMessage,
    status: 'failed',
  };
}

export function isCompletedEntry(entry: Entry): boolean {
  return entry.status === 'completed' && entry.translation !== null;
}
