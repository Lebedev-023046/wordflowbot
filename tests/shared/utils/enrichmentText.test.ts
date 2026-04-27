import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeEnrichmentTextCasing,
  normalizeRussianTextCasing,
  normalizeSentenceText,
} from '../../../src/shared/utils/enrichmentText';

test('normalizeRussianTextCasing lowercases all-caps Russian text', () => {
  assert.equal(
    normalizeRussianTextCasing('ОЧЕНЬ СМЕШНОЙ; ЗАХВАТЫВАЮЩЕ СМЕШНОЙ'),
    'очень смешной; захватывающе смешной',
  );
});

test('normalizeRussianTextCasing keeps mixed-case text unchanged', () => {
  assert.equal(normalizeRussianTextCasing('Очень смешной'), 'Очень смешной');
});

test('normalizeEnrichmentTextCasing normalizes translation fields', () => {
  assert.deepEqual(
    normalizeEnrichmentTextCasing({
      examples: [
        {
          text: 'it was hilarious.',
          translation: 'ЭТО БЫЛО ОЧЕНЬ СМЕШНО.',
        },
      ],
      translation: 'ОЧЕНЬ СМЕШНОЙ',
    }),
    {
      examples: [
        {
          text: 'It was hilarious.',
          translation: 'Это было очень смешно.',
        },
      ],
      translation: 'очень смешной',
    },
  );
});

test('normalizeSentenceText uppercases the first non-whitespace character', () => {
  assert.equal(normalizeSentenceText('  hello there.'), '  Hello there.');
});
