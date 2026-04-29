import type {
  CompletedEntry,
  Entry,
  EntryEnrichment,
  FailedEntry,
  PendingEntry,
} from './entry.types';

export function markEntryPending(entry: Entry): PendingEntry {
  return {
    ...entry,
    errorMessage: null,
    examples: [],
    status: 'pending',
    translation: null,
    usage: null,
  };
}

export function completeEntry(
  entry: Entry,
  enrichment: EntryEnrichment,
): CompletedEntry {
  return {
    ...entry,
    errorMessage: null,
    examples: enrichment.examples,
    status: 'completed',
    translation: enrichment.translation,
    usage: enrichment.usage,
  };
}

export function failEntry(entry: Entry, errorMessage: string): FailedEntry {
  return {
    ...entry,
    errorMessage,
    status: 'failed',
  };
}

export function isCompletedEntry(entry: Entry): entry is CompletedEntry {
  return entry.status === 'completed';
}
