import type { HandleTextEntriesResult } from '../../../features/intake-entries/model/handleTextEntries';
import { messages } from '../../../shared/i18n/messages';

export function getReplyText(result: HandleTextEntriesResult): string {
  switch (result.kind) {
    case 'empty':
      return messages.entries.empty;
    case 'duplicatesOnly':
      return messages.entries.duplicatesOnly;
    case 'saved':
      return messages.entries.saved(result.count);
  }
}
