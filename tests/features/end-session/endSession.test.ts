import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { endSession } from '../../../src/features/end-session/model/endSession';

test('endSession stops an active session', async () => {
  const sessions = new InMemorySessionRepository();
  await sessions.startSession(1);

  const result = await endSession(sessions, 1);

  assert.deepEqual(result, {
    kind: 'stopped',
    isActive: false,
  });
  assert.equal(await sessions.hasActiveSession(1), false);
});

test('endSession returns noActive when there is no session', async () => {
  const sessions = new InMemorySessionRepository();

  const result = await endSession(sessions, 1);

  assert.deepEqual(result, {
    kind: 'noActive',
    isActive: false,
  });
});
