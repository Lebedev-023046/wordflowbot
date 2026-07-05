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

  async findFinishedSessionById(userId: number, sessionId: string) {
    return (
      (this.sessionsByUserId.get(userId) ?? []).find(
        (session) => session.id === sessionId && !session.isActive,
      ) ?? null
    );
  }

  async getActiveSession(userId: number) {
    const sessions = this.sessionsByUserId.get(userId) ?? [];

    return [...sessions].reverse().find((session) => session.isActive) ?? null;
  }

  async hasActiveSession(userId: number) {
    return (await this.getActiveSession(userId)) !== null;
  }

  async renameSession(userId: number, sessionId: string, title: string) {
    const sessions = this.sessionsByUserId.get(userId) ?? [];
    const sessionIndex = sessions.findIndex(
      (session) => session.id === sessionId && !session.isActive,
    );

    if (sessionIndex === -1) {
      return null;
    }

    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      title,
    };

    return sessions[sessionIndex];
  }

  async startSession(
    userId: number,
    studyLanguage = 'en',
    translationLanguage = 'ru',
  ) {
    const session: Session = {
      createdAt: new Date(),
      endedAt: null,
      id: crypto.randomUUID(),
      title: null,
      studyLanguage,
      translationLanguage,
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
      return null;
    }

    sessions[activeIndex] = {
      ...sessions[activeIndex],
      endedAt: new Date(),
      isActive: false,
    };

    return sessions[activeIndex];
  }
}
