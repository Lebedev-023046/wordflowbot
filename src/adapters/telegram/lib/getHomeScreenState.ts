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
  activeMessage = messages.session.active,
): Promise<HomeScreenState> {
  const session = await sessions.getActiveSession(userId);

  if (!session) {
    const hasFinishedSessions =
      (await sessions.findFinishedSessions(userId)).length > 0;

    return {
      hasEntries: false,
      hasFailedEntries: false,
      isActive: false,
      message: hasFinishedSessions
        ? messages.session.returningStart
        : messages.session.promptStart,
      mode: hasFinishedSessions ? 'returning' : 'first_time',
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
