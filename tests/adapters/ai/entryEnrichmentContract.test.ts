import assert from 'node:assert/strict';
import test from 'node:test';
import { entryEnrichmentSchema } from '../../../src/adapters/ai/entryEnrichmentSchema';
import { getSystemPrompt } from '../../../src/adapters/ai/system-prompt';

test('entry enrichment schema requires usage and restricts it to A/B/C', () => {
  assert.deepEqual(entryEnrichmentSchema.required, [
    'usage',
    'translation',
    'examples',
  ]);
  assert.deepEqual(entryEnrichmentSchema.properties.usage, {
    enum: ['A', 'B', 'C'],
    type: 'string',
  });
});

test('entry enrichment prompt explains usage labels and keeps the response strict', () => {
  const prompt = getSystemPrompt({
    level: 'B2',
    studyLanguage: 'en',
    translationLanguage: 'ru',
  });

  assert.equal(prompt.length, 1);
  assert.equal(prompt[0]?.type, 'input_text');
  assert.match(prompt[0]?.text ?? '', /Return JSON only\./);
  assert.match(prompt[0]?.text ?? '', /A = 🔥 Most useful/);
  assert.match(prompt[0]?.text ?? '', /B = 👌 Good to know/);
  assert.match(prompt[0]?.text ?? '', /C = 🪶 Rarely used/);
  assert.match(prompt[0]?.text ?? '', /exactly 2 natural English examples/);
});

test('entry enrichment prompt adapts to a different study language and level', () => {
  const prompt = getSystemPrompt({
    level: 'A1',
    studyLanguage: 'pl',
    translationLanguage: 'ru',
  });

  assert.match(
    prompt[0]?.text ?? '',
    /You enrich Polish vocabulary entries for a Russian learner\./,
  );
  assert.match(
    prompt[0]?.text ?? '',
    /Assume the learner's current Polish level is A1\./,
  );
  assert.match(prompt[0]?.text ?? '', /exactly 2 natural Polish examples/);
  assert.match(prompt[0]?.text ?? '', /Russian translation/);
});
