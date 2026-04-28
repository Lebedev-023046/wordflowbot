import type { Context, Telegraf } from 'telegraf';
import type { StartSessionUseCase } from '../../../application/use-cases/StartSessionUseCase';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { replyWithSessionState } from '../lib/replyWithSessionState';

export function registerStartCommand(
  bot: Telegraf,
  sessions: SessionRepository,
  startSessionUseCase: StartSessionUseCase,
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
    const result = startSessionUseCase.execute(userId);

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
