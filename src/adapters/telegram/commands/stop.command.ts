import { Markup, type Telegraf } from 'telegraf';
import type { StopSessionUseCase } from '../../../application/use-cases/StopSessionUseCase';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { resolveSessionTitle } from '../../../shared/utils/sessionTitle';
import { getUserId } from '../lib/getUserId';
import { getSessionStateFlags } from '../lib/getSessionStateFlags';
import { replyWithSessionState } from '../lib/replyWithSessionState';
import type { SessionRenameStateStore } from '../lib/sessionRenameState';

const STOP_SESSION_CONFIRM_CALLBACK = 'stop_session:confirm';
const STOP_SESSION_CANCEL_CALLBACK = 'stop_session:cancel';
const STOP_SESSION_RENAME_CALLBACK = 'stop_session:rename';
const STOP_SESSION_SKIP_RENAME_CALLBACK = 'stop_session:skip_rename';

export function registerStopCommand(
  bot: Telegraf,
  entries: EntryRepository,
  sessions: SessionRepository,
  stopSessionUseCase: StopSessionUseCase,
  sessionRenameState: SessionRenameStateStore,
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
    await replyWithSessionState({
      ctx,
      isActive: result.isActive,
      message: messages.session.stopped,
    });

    if (!result.session) {
      return;
    }

    return ctx.reply(
      messages.session.stopRenameOffer,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            buttons.nameSessionSource,
            `${STOP_SESSION_RENAME_CALLBACK}:${result.session.id}`,
          ),
          Markup.button.callback(
            buttons.skipRename,
            `${STOP_SESSION_SKIP_RENAME_CALLBACK}:${result.session.id}`,
          ),
        ],
      ]),
    );
  });

  bot.action(STOP_SESSION_CANCEL_CALLBACK, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();

    const userId = getUserId(ctx);
    const state = await getSessionStateFlags(entries, sessions, userId);

    return replyWithSessionState({
      ctx,
      hasEntries: state.hasEntries,
      hasFailedEntries: state.hasFailedEntries,
      isActive: state.isActive,
      message: messages.session.stopCancelled,
    });
  });

  bot.action(
    new RegExp(`^${STOP_SESSION_RENAME_CALLBACK}:.+$`),
    async (ctx) => {
      await ctx.answerCbQuery();

      const userId = getUserId(ctx);
      const sessionId =
        'data' in ctx.callbackQuery
          ? ctx.callbackQuery.data.slice(
              `${STOP_SESSION_RENAME_CALLBACK}:`.length,
            )
          : '';
      const session = await sessions.findFinishedSessionById(userId, sessionId);

      if (!session) {
        return ctx.reply(messages.library.sessionMissing);
      }

      const currentTitle = resolveSessionTitle(session);
      const prompt = await ctx.reply(
        messages.library.renamePrompt(currentTitle),
        {
          reply_markup: {
            force_reply: true,
            input_field_placeholder: currentTitle,
            selective: true,
          },
        },
      );

      sessionRenameState.set(userId, {
        promptMessageId: prompt.message_id,
        sessionId,
        source: 'post_finish',
      });

      return ctx.deleteMessage();
    },
  );

  bot.action(
    new RegExp(`^${STOP_SESSION_SKIP_RENAME_CALLBACK}:.+$`),
    async (ctx) => {
      await ctx.answerCbQuery();
      return ctx.deleteMessage();
    },
  );
}
