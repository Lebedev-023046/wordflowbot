import { Markup, type Telegraf } from 'telegraf';
import type { ClearSessionUseCase } from '../../../application/use-cases/ClearSessionUseCase';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { replyWithSessionState } from '../lib/replyWithSessionState';

const CLEAR_SESSION_CONFIRM_CALLBACK = 'clear_session:confirm';
const CLEAR_SESSION_CANCEL_CALLBACK = 'clear_session:cancel';

export function registerClearSessionCommand(
  bot: Telegraf,
  clearSessionUseCase: ClearSessionUseCase,
) {
  bot.hears(buttons.clearSession, (ctx) => {
    const userId = getUserId(ctx);
    const result = clearSessionUseCase.preview(userId);

    if (result.kind === 'noActive') {
      return replyWithSessionState({
        ctx,
        isActive: false,
        message: messages.session.noActive,
      });
    }

    return ctx.reply(
      messages.session.clearConfirm,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            buttons.confirmClearSession,
            CLEAR_SESSION_CONFIRM_CALLBACK,
          ),
          Markup.button.callback(
            buttons.cancelClearSession,
            CLEAR_SESSION_CANCEL_CALLBACK,
          ),
        ],
      ]),
    );
  });

  bot.action(CLEAR_SESSION_CONFIRM_CALLBACK, async (ctx) => {
    await ctx.answerCbQuery();

    const userId = getUserId(ctx);
    const result = clearSessionUseCase.execute(userId);

    if (result.kind === 'noActive') {
      return ctx.editMessageText(messages.session.noActive);
    }

    return ctx.editMessageText(messages.session.cleared(result.clearedEntries));
  });

  bot.action(CLEAR_SESSION_CANCEL_CALLBACK, async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.editMessageText(messages.session.clearCancelled);
  });
}
