import type {
  ProcessEntryParams,
  ProcessEntryResult,
} from './process-entry.types';
import { createLogger } from '../../../shared/logging/logger';
import { getErrorDetails, getErrorMessage } from '../../../shared/utils/errors';
import { getEntryFailureKind } from './getEntryFailureKind';

const logger = createLogger({
  scope: 'processEntry',
});

export async function processEntry({
  entry,
  entryEnrichmentClient,
  entryRepository,
  }: ProcessEntryParams): Promise<ProcessEntryResult> {
  try {
    const enrichment = await entryEnrichmentClient.enrich(entry.text);
    entryRepository.updateEnrichment(entry.id, enrichment);
    entryRepository.updateStatus(entry.id, 'completed');

    return {
      kind: 'succeeded',
      text: entry.text,
      translation: enrichment.translation,
    };
  } catch (error) {
    const errorMessage = getErrorMessage(error, 'Entry enrichment failed.');
    const failureKind = getEntryFailureKind(error);

    logger.error('Entry enrichment failed.', {
      entryId: entry.id,
      error: getErrorDetails(error),
      errorMessage,
      failureKind,
      text: entry.text,
    });

    entryRepository.updateError(entry.id, errorMessage);
    entryRepository.updateStatus(entry.id, 'failed');

    return {
      kind: 'failed',
      failureKind,
      text: entry.text,
    };
  }
}
