import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemorySessionRepository } from '../../../src/adapters/storage/InMemorySessionRepository';
import { startSession } from '../../../src/features/start-session/model/startSession';

test('startSession starts a session for a user without an active session', () => {
  const sessions = new InMemorySessionRepository();

  const result = startSession(sessions, 1);

  assert.deepEqual(result, {
    kind: 'started',
    isActive: true,
  });
  assert.equal(sessions.hasActiveSession(1), true);
});

test('startSession returns alreadyActive when a session already exists', () => {
  const sessions = new InMemorySessionRepository();
  sessions.startSession(1);

  const result = startSession(sessions, 1);

  assert.deepEqual(result, {
    kind: 'alreadyActive',
    isActive: true,
  });
});
