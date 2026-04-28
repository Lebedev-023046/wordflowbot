import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryEntryRepository } from '../../src/adapters/storage/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../src/adapters/storage/InMemorySessionRepository';
import { EntryFactory } from '../../src/application/services/EntryFactory';
import { GetSessionWordsUseCase } from '../../src/application/use-cases/GetSessionWordsUseCase';

test('GetSessionWordsUseCase returns noActive without an active session', () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();

  const result = new GetSessionWordsUseCase(sessions, entries).execute(1);

  assert.deepEqual(result, { kind: 'noActive' });
});

test('GetSessionWordsUseCase returns empty when the session has no entries', () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  sessions.startSession(1);

  const result = new GetSessionWordsUseCase(sessions, entries).execute(1);

  assert.deepEqual(result, { kind: 'empty' });
});

test('GetSessionWordsUseCase returns completed and failed session words separately', () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const entryFactory = new EntryFactory();
  const session = sessions.startSession(1);

  entries.saveMany([
    {
      ...entryFactory.createPending(session.id, 'hassle'),
      status: 'completed',
      translation: 'translation for hassle',
    },
    entryFactory.createPending(session.id, 'pull through'),
    {
      ...entryFactory.createPending(session.id, 'rumor'),
      errorMessage:
        'Could not finish this item right now. Please try again later.',
      status: 'failed',
    },
  ]);

  const result = new GetSessionWordsUseCase(sessions, entries).execute(1);

  assert.deepEqual(result, {
    completedItems: [
      {
        text: 'hassle',
        translation: 'translation for hassle',
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
