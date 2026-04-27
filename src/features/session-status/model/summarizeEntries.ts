import type { Entry } from '../../../entities/entry/model/entry.types';

export interface FailedEntrySummary {
  errorMessage: string;
  text: string;
}

export interface EntryStatusSummary {
  completedEntries: number;
  failedEntries: FailedEntrySummary[];
  failedEntriesCount: number;
  pendingEntries: number;
  totalEntries: number;
}

export function summarizeEntries(entries: Entry[]): EntryStatusSummary {
  const pendingEntries = entries.filter((entry) => entry.status === 'pending').length;
  const completedEntries = entries.filter((entry) => entry.status === 'completed').length;
  const failedEntries = entries
    .filter((entry) => entry.status === 'failed' && entry.errorMessage)
    .map((entry) => ({
      errorMessage: entry.errorMessage ?? 'Unknown error.',
      text: entry.text,
    }));

  return {
    completedEntries,
    failedEntries,
    failedEntriesCount: entries.filter((entry) => entry.status === 'failed').length,
    pendingEntries,
    totalEntries: entries.length,
  };
}
