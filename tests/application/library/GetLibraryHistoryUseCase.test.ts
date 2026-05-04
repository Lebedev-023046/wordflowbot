import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { EntryFactory } from '../../../src/application/services/EntryFactory';
import { GetLibraryHistoryUseCase } from '../../../src/application/library/queries/GetLibraryHistoryUseCase';
import { completeEntry } from '../../../src/entities/entry/model/entryState';

test('GetLibraryHistoryUseCase returns finished sessions with default titles and completed word counts', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const entryFactory = new EntryFactory();

  const session = await sessions.startSession(1);
  await entries.saveMany([
    completeEntry(entryFactory.createPending(session.id, 'hassle'), {
      examples: [],
      translation: 'translation for hassle',
      usage: 'A',
    }),
    completeEntry(entryFactory.createPending(session.id, 'rumor'), {
      examples: [],
      translation: 'translation for rumor',
      usage: 'B',
    }),
  ]);
  await sessions.stopSession(1);

  const result = await new GetLibraryHistoryUseCase(sessions, entries).execute(
    1,
  );

  assert.equal(result.kind, 'ready');

  if (result.kind !== 'ready') {
    return;
  }

  assert.equal(result.items.length, 1);
  assert.match(
    result.items[0]?.title ?? '',
    /^\d{2} [A-Z][a-z]{2} \d{2}:\d{2}$/,
  );
  assert.match(
    result.items[0]?.endedAtLabel ?? '',
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
  );
  assert.equal(result.items[0]?.completedWords, 2);
});

test('GetLibraryHistoryUseCase returns empty when there are no finished sessions', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();

  const result = await new GetLibraryHistoryUseCase(sessions, entries).execute(
    1,
  );

  assert.deepEqual(result, {
    kind: 'empty',
  });
});
