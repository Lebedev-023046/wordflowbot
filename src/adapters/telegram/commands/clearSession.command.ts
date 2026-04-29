import { Markup, type Telegraf } from 'telegraf';
import type { ClearSessionUseCase } from '../../../application/use-cases/ClearSessionUseCase';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { getSessionStateFlags } from '../lib/getSessionStateFlags';
import { replyWithSessionState } from '../lib/replyWithSessionState';

const CLEAR_SESSION_CONFIRM_CALLBACK = 'clear_session:confirm';
const CLEAR_SESSION_CANCEL_CALLBACK = 'clear_session:cancel';

export function registerClearSessionCommand(
  bot: Telegraf,
  entries: EntryRepository,
  sessions: SessionRepository,
  clearSessionUseCase: ClearSessionUseCase,
) {
  bot.hears(buttons.clearSession, async (ctx) => {
    const userId = getUserId(ctx);
    const result = await clearSessionUseCase.preview(userId);

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
    const result = await clearSessionUseCase.execute(userId);

    if (result.kind === 'noActive') {
      await ctx.editMessageText(messages.session.noActive);
      return replyWithSessionState({
        ctx,
        isActive: false,
        message: messages.session.noActive,
      });
    }

    await ctx.editMessageText(messages.session.cleared(result.clearedEntries));
    return replyWithSessionState({
      ctx,
      hasEntries: false,
      hasFailedEntries: false,
      isActive: true,
      message: messages.session.cleared(result.clearedEntries),
    });
  });

  bot.action(CLEAR_SESSION_CANCEL_CALLBACK, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(messages.session.clearCancelled);

    const userId = getUserId(ctx);
    const state = await getSessionStateFlags(entries, sessions, userId);

    return replyWithSessionState({
      ctx,
      hasEntries: state.hasEntries,
      hasFailedEntries: state.hasFailedEntries,
      isActive: state.isActive,
      message: messages.session.clearCancelled,
    });
  });
}
