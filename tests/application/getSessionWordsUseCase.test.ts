import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryEntryRepository } from '../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { EntryFactory } from '../../src/application/services/EntryFactory';
import { GetSessionWordsUseCase } from '../../src/application/use-cases/GetSessionWordsUseCase';

test('GetSessionWordsUseCase returns noActive without an active session', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();

  const result = await new GetSessionWordsUseCase(sessions, entries).execute(1);

  assert.deepEqual(result, { kind: 'noActive' });
});

test('GetSessionWordsUseCase returns empty when the session has no entries', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  await sessions.startSession(1);

  const result = await new GetSessionWordsUseCase(sessions, entries).execute(1);

  assert.deepEqual(result, { kind: 'empty' });
});

test('GetSessionWordsUseCase returns completed and failed session words separately', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const entryFactory = new EntryFactory();
  const session = await sessions.startSession(1);

  await entries.saveMany([
    {
      ...entryFactory.createPending(session.id, 'hassle'),
      status: 'completed',
      translation: 'translation for hassle',
      usage: 'B',
    },
    entryFactory.createPending(session.id, 'pull through'),
    {
      ...entryFactory.createPending(session.id, 'rumor'),
      errorMessage:
        'Could not finish this item right now. Please try again later.',
      status: 'failed',
    },
  ]);

  const result = await new GetSessionWordsUseCase(sessions, entries).execute(1);

  assert.deepEqual(result, {
    completedItems: [
      {
        text: 'hassle',
        translation: 'translation for hassle',
        usage: 'B',
      },
    ],
    failedItems: [
      {
        text: 'rumor',
      },
    ],
    kind: 'active',
  });
});
