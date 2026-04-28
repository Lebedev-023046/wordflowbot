import assert from 'node:assert/strict';
import test from 'node:test';
import { messages } from '../../../src/shared/i18n/messages';

test('status message truncates long ready and failed sections', () => {
  assert.equal(
    messages.status.active({
      completedEntries: 12,
      completedEntrySummaries: Array.from({ length: 12 }, (_, index) => ({
        text: `word-${index + 1}`,
        translation: `translation-${index + 1}`,
      })),
      failedEntries: Array.from({ length: 12 }, (_, index) => ({
        errorMessage: `error-${index + 1}`,
        text: `failed-${index + 1}`,
      })),
      failedEntriesCount: 12,
      pendingEntries: 3,
      totalEntries: 27,
    }),
    [
      'Saved: 27 items',
      'Still processing: 3 items',
      'Ready: 12 items',
      'Need retry: 12 items',
      '',
      'Ready pairs:',
      'word-1 - translation-1',
      'word-2 - translation-2',
      'word-3 - translation-3',
      'word-4 - translation-4',
      'word-5 - translation-5',
      'word-6 - translation-6',
      'word-7 - translation-7',
      'word-8 - translation-8',
      'word-9 - translation-9',
      'word-10 - translation-10',
      '...and 2 items more.',
      '',
      'Failed items:',
      '1. failed-1 - error-1',
      '2. failed-2 - error-2',
      '3. failed-3 - error-3',
      '4. failed-4 - error-4',
      '5. failed-5 - error-5',
      '6. failed-6 - error-6',
      '7. failed-7 - error-7',
      '8. failed-8 - error-8',
      '9. failed-9 - error-9',
      '10. failed-10 - error-10',
      '...and 2 items more.',
      '',
      'Tap Retry failed or use /retry_failed to try those items again.',
    ].join('\n'),
  );
});
