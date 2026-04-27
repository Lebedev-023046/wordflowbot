import type { HandleTextEntriesResult } from '../../../features/intake-entries/model/handleTextEntries';
import type { ProcessEntriesResult } from '../../../processes/entry-enrichment/model/processEntries';
import { messages } from '../../../shared/i18n/messages';

export function getInitialReplyText(result: HandleTextEntriesResult): string {
  switch (result.kind) {
    case 'empty':
      return messages.entries.empty;
    case 'duplicatesOnly':
      return messages.entries.duplicatesOnly;
    case 'saved':
      return messages.entries.processing(result.count);
  }
}

export function formatProcessedEntriesReply(result: ProcessEntriesResult): string {
  const lines = result.succeeded.map((entry) => `${entry.text} - ${entry.translation}`);

  if (result.failedCount > 0) {
    lines.push('', messages.entries.processedWithFailures(result.failedCount));
  }

  return lines.join('\n');
}
