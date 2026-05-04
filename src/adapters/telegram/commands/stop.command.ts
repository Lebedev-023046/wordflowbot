import { Markup, type Telegraf } from 'telegraf';
import type { StopSessionUseCase } from '../../../application/session/commands/StopSessionUseCase';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getSessionStateFlags } from '../lib/getSessionStateFlags';
import { getUserId } from '../lib/getUserId';
import { renderHomeKeyboard } from '../lib/homeKeyboard';
import type { PendingSessionRenameStore } from '../lib/pendingSessionRenameState';
import { replyWithSessionState } from '../lib/replyWithSessionState';

const STOP_SESSION_CONFIRM_CALLBACK = 'stop_session:confirm';
const STOP_SESSION_CANCEL_CALLBACK = 'stop_session:cancel';

export function registerStopCommand(
  bot: Telegraf,
  entries: EntryRepository,
  sessions: SessionRepository,
  stopSessionUseCase: StopSessionUseCase,
  _pendingSessionRenameState: PendingSessionRenameStore,
) {
  bot.hears(buttons.stopSession, async (ctx) => {
    const userId = getUserId(ctx);
    const result = await stopSessionUseCase.preview(userId);

    if (result.kind === 'noActive') {
      return replyWithSessionState({
        ctx,
        message: messages.session.noActive,
        isActive: result.isActive,
      });
    }

    return ctx.reply(
      messages.session.stopConfirm,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            buttons.confirmStopSession,
            STOP_SESSION_CONFIRM_CALLBACK,
          ),
          Markup.button.callback(
            buttons.cancelStopSession,
            STOP_SESSION_CANCEL_CALLBACK,
          ),
        ],
      ]),
    );
  });

  bot.action(STOP_SESSION_CONFIRM_CALLBACK, async (ctx) => {
    await ctx.answerCbQuery();

    const userId = getUserId(ctx);
    const result = await stopSessionUseCase.execute(userId);

    if (result.kind === 'noActive') {
      await ctx.deleteMessage();
      return replyWithSessionState({
        ctx,
        isActive: false,
        message: messages.session.noActive,
      });
    }

    await ctx.deleteMessage();
    await ctx.reply(messages.session.stopped, renderHomeKeyboard('returning'));
  });

  bot.action(STOP_SESSION_CANCEL_CALLBACK, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();

    const userId = getUserId(ctx);
    const state = await getSessionStateFlags(entries, sessions, userId);

    return replyWithSessionState({
      ctx,
      isActive: state.isActive,
      message: messages.session.stopCancelled,
    });
  });
}
