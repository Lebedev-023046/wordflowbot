import type { Context, Telegraf } from 'telegraf';
import type { GetSessionWordsUseCase } from '../../../application/use-cases/GetSessionWordsUseCase';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { replyWithSessionState } from '../lib/replyWithSessionState';
import {
  buildSessionWordsInlineKeyboard,
  buildSessionWordsReply,
  parseSessionWordsCallbackData,
  SESSION_WORDS_NOOP_CALLBACK,
} from '../lib/sessionWordsPagination';

export function registerSessionWordsCommand(
  bot: Telegraf,
  getSessionWordsUseCase: GetSessionWordsUseCase,
) {
  const handleShowWords = (ctx: Context) => {
    const userId = getUserId(ctx);
    const result = getSessionWordsUseCase.execute(userId);

    if (result.kind === 'noActive') {
      return replyWithSessionState({
        ctx,
        isActive: false,
        message: messages.session.noActive,
      });
    }

    if (result.kind === 'empty') {
      return replyWithSessionState({
        ctx,
        isActive: true,
        message: messages.session.noWordsYet,
      });
    }

    return ctx.reply(
      buildSessionWordsReply(result.completedItems, result.failedItems, {
        completedPage: 0,
        failedPage: 0,
      }),
      buildSessionWordsInlineKeyboard(
        result.completedItems,
        result.failedItems,
        {
          completedPage: 0,
          failedPage: 0,
        },
      ),
    );
  };

  bot.command('words', handleShowWords);
  bot.hears(buttons.showWords, handleShowWords);

  bot.action(SESSION_WORDS_NOOP_CALLBACK, async (ctx) => {
    await ctx.answerCbQuery();
  });

  bot.action(/^session_words:\d+:\d+$/, async (ctx) => {
    const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
    const pageState = parseSessionWordsCallbackData(data);

    await ctx.answerCbQuery();

    if (!pageState) {
      return;
    }

    const userId = getUserId(ctx);
    const result = getSessionWordsUseCase.execute(userId);

    if (result.kind === 'noActive') {
      return ctx.editMessageText(messages.session.noActive);
    }

    if (result.kind === 'empty') {
      return ctx.editMessageText(messages.session.noWordsYet);
    }

    return ctx.editMessageText(
      buildSessionWordsReply(
        result.completedItems,
        result.failedItems,
        pageState,
      ),
      buildSessionWordsInlineKeyboard(
        result.completedItems,
        result.failedItems,
        pageState,
      ),
    );
  });
}
