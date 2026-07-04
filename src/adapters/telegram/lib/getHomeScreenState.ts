import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { messages } from '../../../shared/i18n/messages';

export interface HomeScreenState {
  hasEntries: boolean;
  hasFailedEntries: boolean;
  isActive: boolean;
  message: string;
  mode: 'active' | 'first_time' | 'returning';
}

export async function getHomeScreenState(
  entries: EntryRepository,
  sessions: SessionRepository,
  userId: number,
  activeMessage: string = messages.session.active,
): Promise<HomeScreenState> {
  const session = await sessions.getActiveSession(userId);

  if (!session) {
    const finishedSessions = await sessions.findFinishedSessions(userId);
    const hasFinishedSessions = finishedSessions.length > 0;

    if (!hasFinishedSessions) {
      return {
        hasEntries: false,
        hasFailedEntries: false,
        isActive: false,
        message: messages.session.promptStart,
        mode: 'first_time',
      };
    }

    const wordsCollected = (
      await entries.findCompletedBySessionIds(
        finishedSessions.map((finishedSession) => finishedSession.id),
      )
    ).length;

    return {
      hasEntries: false,
      hasFailedEntries: false,
      isActive: false,
      message: messages.session.returningStart(
        finishedSessions.length,
        wordsCollected,
      ),
      mode: 'returning',
    };
  }

  const sessionEntries = await entries.findBySessionId(session.id);

  return {
    hasEntries: sessionEntries.length > 0,
    hasFailedEntries: sessionEntries.some((entry) => entry.status === 'failed'),
    isActive: true,
    message: activeMessage,
    mode: 'active',
  };
}
