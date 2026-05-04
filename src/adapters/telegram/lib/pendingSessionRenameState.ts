export type SessionRenameSource = 'history' | 'post_finish';

export interface PendingSessionRename {
  historyPage?: number;
  promptMessageId: number;
  sessionId: string;
  source: SessionRenameSource;
}

export class PendingSessionRenameStore {
  private readonly pendingByUserId = new Map<number, PendingSessionRename>();

  clear(userId: number) {
    this.pendingByUserId.delete(userId);
  }

  get(userId: number) {
    return this.pendingByUserId.get(userId) ?? null;
  }

  set(userId: number, pending: PendingSessionRename) {
    this.pendingByUserId.set(userId, pending);
  }
}
