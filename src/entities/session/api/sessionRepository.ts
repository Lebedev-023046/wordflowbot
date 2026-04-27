export interface SessionRepository {
  hasActiveSession(userId: number): boolean;
  startSession(userId: number): void;
  stopSession(userId: number): void;
}
