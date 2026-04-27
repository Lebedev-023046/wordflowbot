import type { EntryEnrichmentClient } from '../../../entities/entry/api/entryEnrichmentClient';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { Entry } from '../../../entities/entry/model/entry.types';

export type ProcessedEntryPreview = {
  text: string;
  translation: string;
};

export type EntryFailureKind = 'insufficient_quota' | 'other';

export type ProcessEntriesResult = {
  failedCount: number;
  failureKinds: EntryFailureKind[];
  succeeded: ProcessedEntryPreview[];
};

export interface ProcessEntriesParams {
  entries: Entry[];
  entryEnrichmentClient: EntryEnrichmentClient;
  entryRepository: EntryRepository;
}

export type ProcessEntryResult =
  | {
      kind: 'failed';
      failureKind: EntryFailureKind;
      text: string;
    }
  | {
      kind: 'succeeded';
      text: string;
      translation: string;
    };

export interface ProcessEntryParams {
  entry: Entry;
  entryEnrichmentClient: EntryEnrichmentClient;
  entryRepository: EntryRepository;
}
