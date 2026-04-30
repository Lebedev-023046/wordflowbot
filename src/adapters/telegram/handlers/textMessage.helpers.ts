import type { AddEntriesFromTextResult } from '../../../application/entries/commands/AddEntriesFromTextUseCase';
import type { ProcessEntriesResult } from '../../../processes/entry-enrichment/model/process-entry.types';
import { messages } from '../../../shared/i18n/messages';

export function getInitialReplyText(result: AddEntriesFromTextResult): string {
  switch (result.kind) {
    case 'empty':
      return messages.entries.empty;
    case 'duplicatesOnly':
      return messages.entries.duplicatesOnly;
    case 'saved':
      return messages.entries.processing(result.count);
  }

  return messages.entries.empty;
}

export function formatProcessedEntriesReply(
  result: ProcessEntriesResult,
): string {
  const lines = [
    getProcessedSummaryLine(result),
    '',
    ...result.succeeded.map((entry) => `${entry.text} - ${entry.translation}`),
  ];

  if (result.failedCount > 0) {
    lines.push('', getFailureSummaryMessage(result));
  }

  return lines.join('\n');
}

export function getProcessedFailuresReplyText(
  result: ProcessEntriesResult,
): string {
  return [
    messages.entries.processingNoCompleted(result.failedCount),
    getFailureSummaryMessage(result),
  ].join('\n');
}

function getProcessedSummaryLine(result: ProcessEntriesResult): string {
  if (result.failedCount === 0) {
    return messages.entries.processingCompleted(result.succeeded.length);
  }

  return messages.entries.processingFinished(
    result.succeeded.length,
    result.failedCount,
  );
}

function getFailureSummaryMessage(result: ProcessEntriesResult): string {
  if (
    result.failedCount > 0 &&
    result.failureKinds.length === result.failedCount &&
    result.failureKinds.every(
      (failureKind) => failureKind === 'insufficient_quota',
    )
  ) {
    return messages.entries.insufficientQuota;
  }

  return messages.entries.processedWithFailures(result.failedCount);
}
