import assert from 'node:assert/strict';
import test from 'node:test';
import { messages } from '../../../src/shared/i18n/messages';

test('session words message shows ready pairs first and failed items second', () => {
  assert.equal(
    messages.session.words(
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

test('session words message shows empty sections when there is nothing completed or failed yet', () => {
  assert.equal(
    messages.session.words([], []),
    [
      'Words in your session:',
      '',
      'Ready pairs:',
      'None yet.',
    ].join('\n'),
  );
});

test('session words message hides the failed section when there are no failed items', () => {
  assert.equal(
    messages.session.words(
      [
        {
          text: 'hassle',
          translation: 'translation for hassle',
        },
      ],
      [],
    ),
    [
      'Words in your session:',
      '',
      'Ready pairs:',
      '1. hassle - translation for hassle',
    ].join('\n'),
  );
});
