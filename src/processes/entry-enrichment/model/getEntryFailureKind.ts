import type { EntryFailureKind } from './process-entry.types';
import type { ErrorWithMetadata } from '../../../shared/utils/errors';

export function getEntryFailureKind(error: unknown): EntryFailureKind {
  if (!(error instanceof Error)) {
    return 'other';
  }

  const errorWithMetadata = error as ErrorWithMetadata;

  if (
    errorWithMetadata.code === 'insufficient_quota' ||
    errorWithMetadata.type === 'insufficient_quota' ||
    (errorWithMetadata.status === 429 &&
      error.message.toLowerCase().includes('quota'))
  ) {
    return 'insufficient_quota';
  }

  return 'other';
}
