export interface Session {
  id: string;
  userId: number;
  isActive: boolean;
}

export interface SessionRepository {
  clearSession(userId: number): void;
  getActiveSession(userId: number): Session | null;
  hasActiveSession(userId: number): boolean;
  startSession(userId: number): Session;
  stopSession(userId: number): void;
}
