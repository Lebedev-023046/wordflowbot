import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { GetFinishedSessionWordsUseCase } from '../../../src/application/library/queries/GetFinishedSessionWordsUseCase';
import { EntryFactory } from '../../../src/application/services/EntryFactory';
import {
  completeEntry,
  failEntry,
} from '../../../src/entities/entry/model/entryState';

test('GetFinishedSessionWordsUseCase returns missing for an unknown finished session', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();

  const result = await new GetFinishedSessionWordsUseCase(
    sessions,
    entries,
  ).execute(1, 'missing');

  assert.deepEqual(result, { kind: 'missing' });
});

test('GetFinishedSessionWordsUseCase returns empty when a finished session has no entries', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const session = await sessions.startSession(1);
  await sessions.stopSession(1);

  const result = await new GetFinishedSessionWordsUseCase(
    sessions,
    entries,
  ).execute(1, session.id);

  assert.equal(result.kind, 'empty');

  if (result.kind !== 'empty') {
    return;
  }

  assert.match(result.title, /^\d{2} [A-Z][a-z]{2} \d{2}:\d{2}$/);
});

test('GetFinishedSessionWordsUseCase returns completed pending and failed words for a finished session', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const entryFactory = new EntryFactory();
  const session = await sessions.startSession(1);

  await entries.saveMany([
    completeEntry(entryFactory.createPending(session.id, 'hassle'), {
      examples: [],
      translation: 'translation for hassle',
      usage: 'B',
    }),
    entryFactory.createPending(session.id, 'pull through'),
    failEntry(entryFactory.createPending(session.id, 'rumor'), 'Rate limited'),
  ]);
  await sessions.stopSession(1);

  const result = await new GetFinishedSessionWordsUseCase(
    sessions,
    entries,
  ).execute(1, session.id);

  if (result.kind !== 'ready') {
    return;
  }

  assert.deepEqual(result.completedItems, [
    {
      text: 'hassle',
      translation: 'translation for hassle',
      usage: 'B',
    },
  ]);
  assert.deepEqual(result.pendingItems, [
    {
      text: 'pull through',
    },
  ]);
  assert.deepEqual(result.failedItems, [
    {
      text: 'rumor',
    },
  ]);
  assert.match(result.title, /^\d{2} [A-Z][a-z]{2} \d{2}:\d{2}$/);
});
