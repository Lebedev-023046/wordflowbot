import type {
  Session,
  SessionRepository,
} from '../../../entities/session/api/sessionRepository';

export class InMemorySessionRepository implements SessionRepository {
  private readonly sessionsByUserId = new Map<number, Session[]>();

  async clearSession(userId: number) {
    const sessions = this.sessionsByUserId.get(userId) ?? [];

    this.sessionsByUserId.set(
      userId,
      sessions.filter((session) => !session.isActive),
    );
  }

  async findFinishedSessions(userId: number) {
    return [...(this.sessionsByUserId.get(userId) ?? [])]
      .filter((session) => !session.isActive)
      .reverse();
  }

  async getActiveSession(userId: number) {
    const sessions = this.sessionsByUserId.get(userId) ?? [];

    return [...sessions].reverse().find((session) => session.isActive) ?? null;
  }

  async hasActiveSession(userId: number) {
    return (await this.getActiveSession(userId)) !== null;
  }

  async startSession(userId: number) {
    const session: Session = {
      createdAt: new Date(),
      endedAt: null,
      id: crypto.randomUUID(),
      title: null,
      userId,
      isActive: true,
    };

    const sessions = this.sessionsByUserId.get(userId) ?? [];
    sessions.push(session);
    this.sessionsByUserId.set(userId, sessions);

    return session;
  }

  async stopSession(userId: number) {
    const sessions = this.sessionsByUserId.get(userId) ?? [];
    const activeIndex = [...sessions]
      .map((session) => session.isActive)
      .lastIndexOf(true);

    if (activeIndex === -1) {
      return;
    }

    sessions[activeIndex] = {
      ...sessions[activeIndex],
      endedAt: new Date(),
      isActive: false,
    };
  }
}
