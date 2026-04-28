import type {
  Session,
  SessionRepository,
} from '../../entities/session/api/sessionRepository';

export class InMemorySessionRepository implements SessionRepository {
  private sessions = new Map<number, Session>();

  clearSession(userId: number) {
    this.sessions.delete(userId);
  }

  getActiveSession(userId: number) {
    const session = this.sessions.get(userId);

    if (!session || !session.isActive) {
      return null;
    }

    return session;
  }

  hasActiveSession(userId: number) {
    return this.getActiveSession(userId) !== null;
  }

  startSession(userId: number) {
    const session: Session = {
      id: crypto.randomUUID(),
      userId,
      isActive: true,
    };

    this.sessions.set(userId, session);

    return session;
  }

  stopSession(userId: number) {
    const session = this.sessions.get(userId);

    if (!session) {
      return;
    }

    this.sessions.set(userId, {
      ...session,
      isActive: false,
    });
  }
}
