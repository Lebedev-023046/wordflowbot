import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';

export type SessionStatusResult =
  | { kind: 'noActive' }
  | {
      kind: 'active';
      totalEntries: number;
    };

export function getSessionStatus(
  sessionRepository: SessionRepository,
  entryRepository: EntryRepository,
  userId: number,
): SessionStatusResult {
  const session = sessionRepository.getActiveSession(userId);

  if (!session) {
    return { kind: 'noActive' };
  }

  const entries = entryRepository.findBySessionId(session.id);

  return {
    kind: 'active',
    totalEntries: entries.length,
  };
}
