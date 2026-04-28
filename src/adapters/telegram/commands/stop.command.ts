import type { Telegraf } from 'telegraf';
import type { StopSessionUseCase } from '../../../application/use-cases/StopSessionUseCase';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { replyWithSessionState } from '../lib/replyWithSessionState';

export function registerStopCommand(
  bot: Telegraf,
  stopSessionUseCase: StopSessionUseCase,
) {
  bot.hears(buttons.stopSession, async (ctx) => {
    const userId = getUserId(ctx);
    const result = await stopSessionUseCase.execute(userId);

    if (result.kind === 'noActive') {
      return replyWithSessionState({
        ctx,
        message: messages.session.noActive,
        isActive: result.isActive,
      });
    }

    return replyWithSessionState({
      ctx,
      message: messages.session.stopped,
      isActive: result.isActive,
    });
  });
}
