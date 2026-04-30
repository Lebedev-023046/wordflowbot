import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryEntryRepository } from '../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { EntryFactory } from '../../src/application/services/EntryFactory';
import { GetLibraryWordsUseCase } from '../../src/application/use-cases/GetLibraryWordsUseCase';
import { completeEntry } from '../../src/entities/entry/model/entryState';

test('GetLibraryWordsUseCase returns completed words from finished sessions only', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const entryFactory = new EntryFactory();

  const firstSession = await sessions.startSession(1);
  await entries.save(
    completeEntry(entryFactory.createPending(firstSession.id, 'hassle'), {
      examples: [],
      translation: 'translation for hassle',
      usage: 'A',
    }),
  );
  await sessions.stopSession(1);

  const activeSession = await sessions.startSession(1);
  await entries.save(
    completeEntry(entryFactory.createPending(activeSession.id, 'rumor'), {
      examples: [],
      translation: 'translation for rumor',
      usage: 'B',
    }),
  );

  const result = await new GetLibraryWordsUseCase(sessions, entries).execute(1);

  assert.deepEqual(result, {
    items: [
      {
        text: 'hassle',
        translation: 'translation for hassle',
        usage: 'A',
      },
    ],
    kind: 'ready',
  });
});

test('GetLibraryWordsUseCase returns empty when there are no finished-session words', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();

  const result = await new GetLibraryWordsUseCase(sessions, entries).execute(1);

  assert.deepEqual(result, {
    kind: 'empty',
  });
});
