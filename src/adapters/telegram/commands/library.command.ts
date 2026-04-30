import type { Context, Telegraf } from 'telegraf';
import type { GetLibraryStatisticsUseCase } from '../../../application/use-cases/GetLibraryStatisticsUseCase';
import type { GetLibraryWordsUseCase } from '../../../application/use-cases/GetLibraryWordsUseCase';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { getSessionStateFlags } from '../lib/getSessionStateFlags';
import { renderLibraryKeyboard } from '../lib/libraryKeyboard';
import {
  buildLibraryWordsInlineKeyboard,
  buildLibraryWordsReply,
  LIBRARY_WORDS_NOOP_CALLBACK,
  parseLibraryWordsCallbackData,
} from '../lib/libraryWordsPagination';
import { replyWithSessionState } from '../lib/replyWithSessionState';

export function registerLibraryCommand(
  bot: Telegraf,
  entries: EntryRepository,
  sessions: SessionRepository,
  getLibraryStatisticsUseCase: GetLibraryStatisticsUseCase,
  getLibraryWordsUseCase: GetLibraryWordsUseCase,
) {
  bot.hears(buttons.myLibrary, async (ctx) =>
    ctx.reply(messages.library.menu, renderLibraryKeyboard()),
  );

  bot.hears(buttons.back, async (ctx) => {
    const state = await getSessionStateFlags(entries, sessions, getUserId(ctx));

    return replyWithSessionState({
      ctx,
      hasEntries: state.hasEntries,
      hasFailedEntries: state.hasFailedEntries,
      isActive: state.isActive,
      message: state.isActive
        ? messages.session.active
        : messages.session.promptStart,
    });
  });

  bot.hears(buttons.statistics, async (ctx) => {
    const result = await getLibraryStatisticsUseCase.execute(getUserId(ctx));

    return ctx.reply(
      messages.library.statistics(result),
      renderLibraryKeyboard(),
    );
  });

  const handleMyWords = async (ctx: Context) => {
    const result = await getLibraryWordsUseCase.execute(getUserId(ctx));

    if (result.kind === 'empty') {
      return ctx.reply(messages.library.noWordsYet, renderLibraryKeyboard());
    }

    return ctx.reply(
      buildLibraryWordsReply(result.items, {
        aPage: 0,
        bPage: 0,
        cPage: 0,
        view: 'all',
      }),
      buildLibraryWordsInlineKeyboard(result.items, {
        aPage: 0,
        bPage: 0,
        cPage: 0,
        view: 'all',
      }),
    );
  };

  bot.hears(buttons.myWords, handleMyWords);

  bot.hears(buttons.history, async (ctx) =>
    ctx.reply(messages.library.historyPending, renderLibraryKeyboard()),
  );

  bot.action(LIBRARY_WORDS_NOOP_CALLBACK, async (ctx) => {
    await ctx.answerCbQuery();
  });

  bot.action(/^library_words:(all|A|B|C):\d+:\d+:\d+$/, async (ctx) => {
    const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
    const pageState = parseLibraryWordsCallbackData(data);

    await ctx.answerCbQuery();

    if (!pageState) {
      return;
    }

    const result = await getLibraryWordsUseCase.execute(getUserId(ctx));

    if (result.kind === 'empty') {
      return ctx.editMessageText(messages.library.noWordsYet, {
        reply_markup: {
          inline_keyboard: [],
        },
      });
    }

    return ctx.editMessageText(
      buildLibraryWordsReply(result.items, pageState),
      buildLibraryWordsInlineKeyboard(result.items, pageState),
    );
  });
}
