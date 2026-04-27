import type { SessionRepository } from '../../entities/session/api/sessionRepository';

export class InMemorySessionRepository implements SessionRepository {
  private sessions = new Map<number, boolean>();

  hasActiveSession(userId: number) {
    return this.sessions.get(userId) ?? false;
  }

  startSession(userId: number) {
    this.sessions.set(userId, true);
  }

  stopSession(userId: number) {
    this.sessions.set(userId, false);
  }
}
