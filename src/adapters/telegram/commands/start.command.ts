import type { Context, Telegraf } from 'telegraf';
import type { StartSessionUseCase } from '../../../application/use-cases/StartSessionUseCase';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { replyWithSessionState } from '../lib/replyWithSessionState';

export function registerStartCommand(
  bot: Telegraf,
  entries: EntryRepository,
  sessions: SessionRepository,
  startSessionUseCase: StartSessionUseCase,
) {
  const showStartState = (ctx: Context) => {
    const userId = getUserId(ctx);
    const session = sessions.getActiveSession(userId);
    const isActive = session !== null;
    const message = isActive
      ? messages.session.active
      : messages.session.promptStart;
    return replyWithSessionState({
      ctx,
      hasEntries: session ? hasEntries(entries, session.id) : false,
      hasFailedEntries: session ? hasFailedEntries(entries, session.id) : false,
      message,
      isActive,
    });
  };

  bot.start(showStartState);

  bot.hears(buttons.startSession, (ctx) => {
    const userId = getUserId(ctx);
    const result = startSessionUseCase.execute(userId);

    if (result.kind === 'alreadyActive') {
      const session = sessions.getActiveSession(userId);
      return replyWithSessionState({
        ctx,
        hasEntries: session ? hasEntries(entries, session.id) : false,
        hasFailedEntries: session
          ? hasFailedEntries(entries, session.id)
          : false,
        message: messages.session.alreadyActive,
        isActive: result.isActive,
      });
    }

    return replyWithSessionState({
      ctx,
      message: messages.session.started,
      isActive: result.isActive,
    });
  });
}

function hasFailedEntries(
  entryRepository: EntryRepository,
  sessionId: string,
): boolean {
  return entryRepository
    .findBySessionId(sessionId)
    .some((entry) => entry.status === 'failed');
}

function hasEntries(
  entryRepository: EntryRepository,
  sessionId: string,
): boolean {
  return entryRepository.findBySessionId(sessionId).length > 0;
}
