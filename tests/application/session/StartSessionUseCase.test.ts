import assert from 'node:assert/strict';
import test from 'node:test';
import { StartSessionUseCase } from '../../../src/application/session/commands/StartSessionUseCase';
import type {
  Session,
  SessionRepository,
} from '../../../src/entities/session/api/sessionRepository';

test('StartSessionUseCase returns alreadyActive when a unique constraint race happens', async () => {
  const sessions: SessionRepository = {
    async clearSession() {},
    async findFinishedSessionById() {
      return null;
    },
    async findFinishedSessions() {
      return [];
    },
    async getActiveSession() {
      return null;
    },
    async hasActiveSession() {
      return false;
    },
    async renameSession() {
      return null;
    },
    async startSession(): Promise<Session> {
      const error = new Error('Unique constraint failed on the fields');
      (error as Error & { code?: string }).code = 'P2002';
      throw error;
    },
    async stopSession() {
      return null;
    },
  };

  const result = await new StartSessionUseCase(sessions).execute(1);

  assert.deepEqual(result, {
    kind: 'alreadyActive',
    isActive: true,
  });
});
