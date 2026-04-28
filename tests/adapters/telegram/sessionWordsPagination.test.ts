import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSessionWordsReply,
  createSessionWordsCallbackData,
  parseSessionWordsCallbackData,
} from '../../../src/adapters/telegram/lib/sessionWordsPagination';

test('session words reply shows ready pairs first and failed items second', () => {
  assert.equal(
    buildSessionWordsReply(
      [
        {
          text: 'hassle',
          translation: 'translation for hassle',
        },
      ],
      [
        {
          text: 'rumor',
        },
      ],
      {
        completedPage: 0,
        failedPage: 0,
      },
    ),
    [
      'Words in your session:',
      '',
      'Ready pairs:',
      '1. hassle - translation for hassle',
      '',
      'Failed:',
      '1. rumor',
    ].join('\n'),
  );
});

test('session words reply omits the failed section when there are no failed items', () => {
  assert.equal(
    buildSessionWordsReply(
      [
        {
          text: 'hassle',
          translation: 'translation for hassle',
        },
      ],
      [],
      {
        completedPage: 0,
        failedPage: 0,
      },
    ),
    [
      'Words in your session:',
      '',
      'Ready pairs:',
      '1. hassle - translation for hassle',
    ].join('\n'),
  );
});

test('session words reply paginates ready and failed sections independently', () => {
  assert.equal(
    buildSessionWordsReply(
      Array.from({ length: 12 }, (_, index) => ({
        text: `word-${index + 1}`,
        translation: `translation-${index + 1}`,
      })),
      Array.from({ length: 12 }, (_, index) => ({
        text: `failed-${index + 1}`,
      })),
      {
        completedPage: 1,
        failedPage: 1,
      },
    ),
    [
      'Words in your session:',
      '',
      'Ready pairs (2/2):',
      '11. word-11 - translation-11',
      '12. word-12 - translation-12',
      '',
      'Failed (2/2):',
      '11. failed-11',
      '12. failed-12',
    ].join('\n'),
  );
});

test('session words callback data round-trips page state', () => {
  const callbackData = createSessionWordsCallbackData({
    completedPage: 2,
    failedPage: 1,
  });

  assert.equal(callbackData, 'session_words:2:1');
  assert.deepEqual(parseSessionWordsCallbackData(callbackData), {
    completedPage: 2,
    failedPage: 1,
  });
});
