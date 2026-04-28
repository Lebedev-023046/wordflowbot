import type { Entry } from '../../../entities/entry/model/entry.types';
import { isCompletedEntry } from '../../../entities/entry/model/entryState';

export interface CompletedEntrySummary {
  text: string;
  translation: string;
}

export interface FailedEntrySummary {
  errorMessage: string;
  text: string;
}

export interface EntryStatusSummary {
  completedEntries: number;
  completedEntrySummaries: CompletedEntrySummary[];
  failedEntries: FailedEntrySummary[];
  failedEntriesCount: number;
  pendingEntries: number;
  totalEntries: number;
}

export function summarizeEntries(entries: Entry[]): EntryStatusSummary {
  const pendingEntries = entries.filter((entry) => entry.status === 'pending').length;
  const completedEntries = entries.filter(isCompletedEntry);
  const completedEntrySummaries = completedEntries.map((entry) => ({
    text: entry.text,
    translation: entry.translation ?? '',
  }));
  const failedEntries = entries
    .filter((entry) => entry.status === 'failed' && entry.errorMessage)
    .map((entry) => ({
      errorMessage: entry.errorMessage ?? 'Unknown error.',
      text: entry.text,
    }));

  return {
    completedEntries: completedEntries.length,
    completedEntrySummaries,
    failedEntries,
    failedEntriesCount: entries.filter((entry) => entry.status === 'failed').length,
    pendingEntries,
    totalEntries: entries.length,
  };
}
