import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemorySessionRepository } from '../../../src/adapters/storage/InMemorySessionRepository';
import { endSession } from '../../../src/features/end-session/model/endSession';

test('endSession stops an active session', () => {
  const sessions = new InMemorySessionRepository();
  sessions.startSession(1);

  const result = endSession(sessions, 1);

  assert.deepEqual(result, {
    kind: 'stopped',
    isActive: false,
  });
  assert.equal(sessions.hasActiveSession(1), false);
});

test('endSession returns noActive when there is no session', () => {
  const sessions = new InMemorySessionRepository();

  const result = endSession(sessions, 1);

  assert.deepEqual(result, {
    kind: 'noActive',
    isActive: false,
  });
});
