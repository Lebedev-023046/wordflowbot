export interface Session {
  id: string;
  userId: number;
  isActive: boolean;
}

export interface SessionRepository {
  clearSession(userId: number): Promise<void>;
  findFinishedSessions(userId: number): Promise<Session[]>;
  getActiveSession(userId: number): Promise<Session | null>;
  hasActiveSession(userId: number): Promise<boolean>;
  startSession(userId: number): Promise<Session>;
  stopSession(userId: number): Promise<void>;
}
