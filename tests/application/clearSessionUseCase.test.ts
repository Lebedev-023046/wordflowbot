import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryEntryRepository } from '../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { EntryFactory } from '../../src/application/services/EntryFactory';
import { ClearSessionUseCase } from '../../src/application/use-cases/ClearSessionUseCase';

test('ClearSessionUseCase returns noActive when there is no active session', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();

  const result = await new ClearSessionUseCase(sessions, entries).execute(1);

  assert.deepEqual(result, { kind: 'noActive' });
});

test('ClearSessionUseCase removes the active session and all session entries', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const entryFactory = new EntryFactory();
  const session = await sessions.startSession(1);

  await entries.saveMany([
    entryFactory.createPending(session.id, 'hassle'),
    entryFactory.createPending(session.id, 'pull through'),
  ]);

  const result = await new ClearSessionUseCase(sessions, entries).execute(1);

  assert.deepEqual(result, {
    clearedEntries: 2,
    kind: 'cleared',
  });
  assert.equal(await sessions.hasActiveSession(1), false);
  assert.deepEqual(await entries.findBySessionId(session.id), []);
});
