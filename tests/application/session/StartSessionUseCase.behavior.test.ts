import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { InMemoryUserSettingsRepository } from '../../../src/adapters/storage/in-memory/InMemoryUserSettingsRepository';
import { StartSessionUseCase } from '../../../src/application/session/commands/StartSessionUseCase';

test('startSession starts a session for a user without an active session', async () => {
  const sessions = new InMemorySessionRepository();
  const useCase = new StartSessionUseCase(
    sessions,
    new InMemoryUserSettingsRepository(),
  );

  const result = await useCase.execute(1);

  assert.deepEqual(result, {
    kind: 'started',
    isActive: true,
  });
  assert.equal(await sessions.hasActiveSession(1), true);
});

test('startSession returns alreadyActive when a session already exists', async () => {
  const sessions = new InMemorySessionRepository();
  await sessions.startSession(1);
  const useCase = new StartSessionUseCase(
    sessions,
    new InMemoryUserSettingsRepository(),
  );

  const result = await useCase.execute(1);

  assert.deepEqual(result, {
    kind: 'alreadyActive',
    isActive: true,
  });
});
