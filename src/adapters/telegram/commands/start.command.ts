import type { Context, Telegraf } from 'telegraf';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { startSession } from '../../../features/start-session/model/startSession';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { replyWithSessionState } from '../lib/replyWithSessionState';

export function registerStartCommand(
  bot: Telegraf,
  sessions: SessionRepository,
) {
  const showStartState = (ctx: Context) => {
    const userId = getUserId(ctx);
    const isActive = sessions.hasActiveSession(userId);
    const message = isActive
      ? messages.session.active
      : messages.session.promptStart;
    return replyWithSessionState({ ctx, message, isActive });
  };

  bot.start(showStartState);

  bot.hears(buttons.startSession, (ctx) => {
    const userId = getUserId(ctx);
    const result = startSession(sessions, userId);

    if (result.kind === 'alreadyActive') {
      return replyWithSessionState({
        ctx,
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
