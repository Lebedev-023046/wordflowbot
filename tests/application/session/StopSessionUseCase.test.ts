import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { StopSessionUseCase } from '../../../src/application/session/commands/StopSessionUseCase';

test('endSession stops an active session', async () => {
  const sessions = new InMemorySessionRepository();
  await sessions.startSession(1);
  const useCase = new StopSessionUseCase(sessions);

  const result = await useCase.execute(1);

  assert.deepEqual(result, {
    kind: 'stopped',
    isActive: false,
    session: result.session,
  });
  assert.ok(result.session);
  assert.equal(await sessions.hasActiveSession(1), false);
});

test('endSession returns noActive when there is no session', async () => {
  const sessions = new InMemorySessionRepository();
  const useCase = new StopSessionUseCase(sessions);

  const result = await useCase.execute(1);

  assert.deepEqual(result, {
    kind: 'noActive',
    isActive: false,
    session: null,
  });
});
