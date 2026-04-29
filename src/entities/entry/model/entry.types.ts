export type EntryStatus = 'pending' | 'completed' | 'failed';
export type EntryUsage = 'A' | 'B' | 'C';

export type EntryExample = {
  text: string;
  translation: string;
};

export type EntryEnrichment = {
  examples: EntryExample[];
  translation: string;
  usage: EntryUsage;
};

type EntryBase = {
  errorMessage: string | null;
  examples: EntryExample[];
  id: string;
  sessionId: string;
  text: string;
};

export type PendingEntry = EntryBase & {
  status: 'pending';
  translation: null;
  usage: null;
};

export type FailedEntry = EntryBase & {
  status: 'failed';
  translation: string | null;
  usage: EntryUsage | null;
};

export type CompletedEntry = EntryBase & {
  status: 'completed';
  translation: string;
  usage: EntryUsage;
};

export type Entry = PendingEntry | FailedEntry | CompletedEntry;
