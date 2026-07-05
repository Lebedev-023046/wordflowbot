import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryLanguageLevelRepository } from '../../../src/adapters/storage/in-memory/InMemoryLanguageLevelRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { resolveEnrichmentContext } from '../../../src/application/services/resolveEnrichmentContext';

test('resolveEnrichmentContext falls back to session defaults and B2 when no level is set', async () => {
  const sessions = new InMemorySessionRepository();
  const languageLevels = new InMemoryLanguageLevelRepository();
  const session = await sessions.startSession(1);

  const context = await resolveEnrichmentContext(languageLevels, session);

  assert.deepEqual(context, {
    level: 'B2',
    studyLanguage: 'en',
    translationLanguage: 'ru',
  });
});

test('resolveEnrichmentContext uses the session study language and the matching stored level', async () => {
  const sessions = new InMemorySessionRepository();
  const languageLevels = new InMemoryLanguageLevelRepository();
  const session = {
    ...(await sessions.startSession(1)),
    studyLanguage: 'pl',
  };
  languageLevels.setLevel(1, 'pl', 'A1');
  languageLevels.setLevel(1, 'en', 'C1');

  const context = await resolveEnrichmentContext(languageLevels, session);

  assert.deepEqual(context, {
    level: 'A1',
    studyLanguage: 'pl',
    translationLanguage: 'ru',
  });
});
