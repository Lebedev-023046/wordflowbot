import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';

export interface SessionStateFlags {
  hasEntries: boolean;
  hasFailedEntries: boolean;
  isActive: boolean;
}

export async function getSessionStateFlags(
  entries: EntryRepository,
  sessions: SessionRepository,
  userId: number,
): Promise<SessionStateFlags> {
  const session = await sessions.getActiveSession(userId);

  if (!session) {
    return {
      hasEntries: false,
      hasFailedEntries: false,
      isActive: false,
    };
  }

  const sessionEntries = await entries.findBySessionId(session.id);

  return {
    hasEntries: sessionEntries.length > 0,
    hasFailedEntries: sessionEntries.some((entry) => entry.status === 'failed'),
    isActive: true,
  };
}
