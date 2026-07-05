export interface Session {
  createdAt: Date;
  endedAt: Date | null;
  id: string;
  userId: number;
  isActive: boolean;
  title: string | null;
  studyLanguage: string;
  translationLanguage: string;
}

export interface SessionRepository {
  clearSession(userId: number): Promise<void>;
  findFinishedSessionById(
    userId: number,
    sessionId: string,
  ): Promise<Session | null>;
  findFinishedSessions(userId: number): Promise<Session[]>;
  getActiveSession(userId: number): Promise<Session | null>;
  hasActiveSession(userId: number): Promise<boolean>;
  renameSession(
    userId: number,
    sessionId: string,
    title: string,
  ): Promise<Session | null>;
  startSession(
    userId: number,
    studyLanguage: string,
    translationLanguage: string,
  ): Promise<Session>;
  stopSession(userId: number): Promise<Session | null>;
}
