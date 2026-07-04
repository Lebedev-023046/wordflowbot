import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSessionWordsReply,
  createSessionWordsCallbackData,
  parseSessionWordsCallbackData,
} from '../../../src/adapters/telegram/lib/currentSessionWordsPagination';

test('session words reply uses a compact all-words layout for very small sessions', () => {
  assert.equal(
    buildSessionWordsReply(
      [
        {
          text: 'hassle',
          translation: 'translation for hassle',
          usage: 'A',
        },
      ],
      [
        {
          text: 'rumor',
        },
      ],
      {
        aPage: 0,
        bPage: 0,
        cPage: 0,
        failedPage: 0,
        view: 'A',
      },
    ),
    [
      'Current session',
      '',
      'All',
      '1. hassle - translation for hassle',
      '',
      'Need retry:',
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
          usage: 'A',
        },
      ],
      [],
      {
        aPage: 0,
        bPage: 0,
        cPage: 0,
        failedPage: 0,
        view: 'A',
      },
    ),
    ['Current session', '', 'All', '1. hassle - translation for hassle'].join(
      '\n',
    ),
  );
});

test('session words reply paginates filtered usage and failed sections independently', () => {
  assert.equal(
    buildSessionWordsReply(
      [
        ...Array.from({ length: 12 }, (_, index) => ({
          text: `word-a-${index + 1}`,
          translation: `translation-a-${index + 1}`,
          usage: 'A' as const,
        })),
        ...Array.from({ length: 3 }, (_, index) => ({
          text: `word-b-${index + 1}`,
          translation: `translation-b-${index + 1}`,
          usage: 'B' as const,
        })),
      ],
      Array.from({ length: 12 }, (_, index) => ({
        text: `failed-${index + 1}`,
      })),
      {
        aPage: 1,
        bPage: 0,
        cPage: 0,
        failedPage: 1,
        view: 'A',
      },
    ),
    [
      'Current session',
      '',
      '🔥 learn first · 👌 good to know · 🪶 can skip',
      '',
      '🔥 Useful (2/2)',
      '11. word-a-11 - translation-a-11',
      '12. word-a-12 - translation-a-12',
      '',
      'Need retry (2/2):',
      '11. failed-11',
      '12. failed-12',
    ].join('\n'),
  );
});

test('session words reply keeps small mixed sessions as one simple list', () => {
  assert.equal(
    buildSessionWordsReply(
      [
        {
          text: 'hassle',
          translation: 'translation for hassle',
          usage: 'A',
        },
        {
          text: 'rumor',
          translation: 'translation for rumor',
          usage: 'B',
        },
        {
          text: 'peasant',
          translation: 'translation for peasant',
          usage: 'C',
        },
      ],
      [],
      {
        aPage: 0,
        bPage: 0,
        cPage: 0,
        failedPage: 0,
        view: 'all',
      },
    ),
    [
      'Current session',
      '',
      'All',
      '1. hassle - translation for hassle',
      '2. rumor - translation for rumor',
      '3. peasant - translation for peasant',
    ].join('\n'),
  );
});

test('session words callback data round-trips full page state', () => {
  const callbackData = createSessionWordsCallbackData({
    aPage: 2,
    bPage: 1,
    cPage: 0,
    failedPage: 3,
    view: 'all',
  });

  assert.equal(callbackData, 'session_words:all:2:1:0:3');
  assert.deepEqual(parseSessionWordsCallbackData(callbackData), {
    aPage: 2,
    bPage: 1,
    cPage: 0,
    failedPage: 3,
    view: 'all',
  });
});
