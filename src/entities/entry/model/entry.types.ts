export type EntryStatus = 'pending' | 'completed' | 'failed';

export type EntryExample = {
  text: string;
  translation: string;
};

export type EntryEnrichment = {
  examples: EntryExample[];
  translation: string;
};

export type Entry = {
  errorMessage: string | null;
  examples: EntryExample[];
  id: string;
  sessionId: string;
  status: EntryStatus;
  text: string;
  translation: string | null;
};
