import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatProcessedEntriesReply,
  getInitialReplyText,
  getProcessedFailuresReplyText,
} from '../../../src/adapters/telegram/handlers/textMessage.helpers';

test('getInitialReplyText explains that processing has started', () => {
  assert.equal(
    getInitialReplyText({
      count: 2,
      entries: [],
      kind: 'saved',
    }),
    '⏳ Saved 2 items. Processing now.',
  );
});

test('formatProcessedEntriesReply includes a completion summary and ready pairs', () => {
  assert.equal(
    formatProcessedEntriesReply({
      failedCount: 1,
      failureKinds: ['other'],
      succeeded: [
        {
          text: 'hassle',
          translation: 'translation for hassle',
        },
        {
          text: 'pull through',
          translation: 'translation for pull through',
        },
      ],
    }),
    [
      '⚠️ Done. 2 items ready, 1 item needs another try.',
      '',
      'hassle - translation for hassle',
      'pull through - translation for pull through',
      '',
      'I could not finish 1 item this time. They stay saved, and you can try Retry failed.',
    ].join('\n'),
  );
});

test('getProcessedFailuresReplyText explains that no items were completed', () => {
  assert.equal(
    getProcessedFailuresReplyText({
      failedCount: 1,
      failureKinds: ['insufficient_quota'],
      succeeded: [],
    }),
    [
      'No items finished this time. 1 item needs another try.',
      'I could not finish those items right now. They stay saved, and you can try Retry failed.',
    ].join('\n'),
  );
});
