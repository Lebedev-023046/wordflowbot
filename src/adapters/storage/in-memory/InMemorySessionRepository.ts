import type {
  Session,
  SessionRepository,
} from '../../../entities/session/api/sessionRepository';

export class InMemorySessionRepository implements SessionRepository {
  private sessions = new Map<number, Session>();

  async clearSession(userId: number) {
    this.sessions.delete(userId);
  }

  async getActiveSession(userId: number) {
    const session = this.sessions.get(userId);

    if (!session || !session.isActive) {
      return null;
    }

    return session;
  }

  async hasActiveSession(userId: number) {
    return (await this.getActiveSession(userId)) !== null;
  }

  async startSession(userId: number) {
    const session: Session = {
      id: crypto.randomUUID(),
      userId,
      isActive: true,
    };

    this.sessions.set(userId, session);

    return session;
  }

  async stopSession(userId: number) {
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
