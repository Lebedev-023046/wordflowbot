import type { Context, Telegraf } from 'telegraf';
import type { GetFinishedSessionWordsUseCase } from '../../../application/library/queries/GetFinishedSessionWordsUseCase';
import type { GetLibraryHistoryUseCase } from '../../../application/library/queries/GetLibraryHistoryUseCase';
import type { GetLibraryStatisticsUseCase } from '../../../application/library/queries/GetLibraryStatisticsUseCase';
import type { GetLibraryWordsUseCase } from '../../../application/library/queries/GetLibraryWordsUseCase';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import {
  buildFinishedSessionWordsInlineKeyboard,
  buildFinishedSessionWordsReply,
  FINISHED_SESSION_BACK_CALLBACK_PREFIX,
  FINISHED_SESSION_RENAME_CALLBACK_PREFIX,
  FINISHED_SESSION_WORDS_NOOP_CALLBACK,
  parseFinishedSessionWordsCallbackData,
} from '../lib/finishedSessionWordsPagination';
import { getSessionStateFlags } from '../lib/getSessionStateFlags';
import { getUserId } from '../lib/getUserId';
import {
  buildLibraryHistoryInlineKeyboard,
  buildLibraryHistoryReply,
  LIBRARY_HISTORY_NOOP_CALLBACK,
  parseLibraryHistoryCallbackData,
} from '../lib/libraryHistoryPagination';
import { renderLibraryKeyboard } from '../lib/libraryKeyboard';
import {
  buildLibraryWordsInlineKeyboard,
  buildLibraryWordsReply,
  LIBRARY_WORDS_NOOP_CALLBACK,
  parseLibraryWordsCallbackData,
} from '../lib/libraryWordsPagination';
import type { PendingSessionRenameStore } from '../lib/pendingSessionRenameState';
import { replyWithSessionState } from '../lib/replyWithSessionState';
import { promptSessionRename } from '../lib/sessionRenamePrompt';

export function registerLibraryCommand(
  bot: Telegraf,
  entries: EntryRepository,
  sessions: SessionRepository,
  getLibraryStatisticsUseCase: GetLibraryStatisticsUseCase,
  getLibraryWordsUseCase: GetLibraryWordsUseCase,
  getLibraryHistoryUseCase: GetLibraryHistoryUseCase,
  getFinishedSessionWordsUseCase: GetFinishedSessionWordsUseCase,
  pendingSessionRenameState: PendingSessionRenameStore,
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

  const handleHistory = async (ctx: Context) => {
    const result = await getLibraryHistoryUseCase.execute(getUserId(ctx));

    if (result.kind === 'empty') {
      return ctx.reply(messages.library.historyEmpty, renderLibraryKeyboard());
    }

    return ctx.reply(
      buildLibraryHistoryReply(result.items, 0),
      buildLibraryHistoryInlineKeyboard(result.items, 0),
    );
  };

  bot.hears(buttons.history, handleHistory);

  bot.action(LIBRARY_WORDS_NOOP_CALLBACK, async (ctx) => {
    await ctx.answerCbQuery();
  });

  bot.action(LIBRARY_HISTORY_NOOP_CALLBACK, async (ctx) => {
    await ctx.answerCbQuery();
  });

  bot.action(FINISHED_SESSION_WORDS_NOOP_CALLBACK, async (ctx) => {
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

  bot.action(/^library_history:\d+$/, async (ctx) => {
    const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
    const page = parseLibraryHistoryCallbackData(data);

    await ctx.answerCbQuery();

    if (page === null) {
      return;
    }

    const result = await getLibraryHistoryUseCase.execute(getUserId(ctx));

    if (result.kind === 'empty') {
      return ctx.editMessageText(messages.library.historyEmpty, {
        reply_markup: {
          inline_keyboard: [],
        },
      });
    }

    return ctx.editMessageText(
      buildLibraryHistoryReply(result.items, page),
      buildLibraryHistoryInlineKeyboard(result.items, page),
    );
  });

  bot.action(/^library_history_rename:.+:\d+$/, async (ctx) => {
    await ctx.answerCbQuery();

    const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
    const match = /^library_history_rename:(.+):(\d+)$/.exec(data);

    if (!match) {
      return;
    }

    const [, sessionId] = match;
    await promptSessionRename({
      ctx,
      sessionId,
      pendingSessionRenameState,
      sessions,
      source: 'history',
    });
  });

  bot.action(/^library_history_words:.+:\d+$/, async (ctx) => {
    await ctx.answerCbQuery();

    const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
    const match = /^library_history_words:(.+):(\d+)$/.exec(data);

    if (!match) {
      return;
    }

    const [, sessionId, page] = match;
    const result = await getFinishedSessionWordsUseCase.execute(
      getUserId(ctx),
      sessionId,
    );

    if (result.kind === 'missing') {
      return ctx.reply(
        messages.library.sessionMissing,
        renderLibraryKeyboard(),
      );
    }

    if (result.kind === 'empty') {
      return ctx.reply(
        `${messages.library.sessionWordsEmpty}\n\nSession: ${result.title}`,
      );
    }

    const initialPageState = {
      aPage: 0,
      bPage: 0,
      cPage: 0,
      failedPage: 0,
      pendingPage: 0,
      view: 'A' as const,
    };

    return ctx.reply(
      buildFinishedSessionWordsReply(
        result.title,
        result.completedItems,
        result.pendingItems,
        result.failedItems,
        initialPageState,
      ),
      buildFinishedSessionWordsInlineKeyboard(
        sessionId,
        Number(page),
        result.completedItems,
        result.pendingItems,
        result.failedItems,
        initialPageState,
      ),
    );
  });

  bot.action(/^fsw:.+:\d+:(all|A|B|C):\d\d\d\d\d$/, async (ctx) => {
    await ctx.answerCbQuery();

    const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
    const parsed = parseFinishedSessionWordsCallbackData(data);

    if (!parsed) {
      return;
    }

    const result = await getFinishedSessionWordsUseCase.execute(
      getUserId(ctx),
      parsed.sessionId,
    );

    if (result.kind === 'missing') {
      return ctx.editMessageText(messages.library.sessionMissing, {
        reply_markup: {
          inline_keyboard: [],
        },
      });
    }

    if (result.kind === 'empty') {
      return ctx.editMessageText(
        `${messages.library.sessionWordsEmpty}\n\nSession: ${result.title}`,
        {
          reply_markup: {
            inline_keyboard: [],
          },
        },
      );
    }

    return ctx.editMessageText(
      buildFinishedSessionWordsReply(
        result.title,
        result.completedItems,
        result.pendingItems,
        result.failedItems,
        parsed.pageState,
      ),
      buildFinishedSessionWordsInlineKeyboard(
        parsed.sessionId,
        parsed.historyPage,
        result.completedItems,
        result.pendingItems,
        result.failedItems,
        parsed.pageState,
      ),
    );
  });

  bot.action(
    new RegExp(`^${FINISHED_SESSION_RENAME_CALLBACK_PREFIX}:.+:\\d+$`),
    async (ctx) => {
      await ctx.answerCbQuery();

      const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
      const match = new RegExp(
        `^${FINISHED_SESSION_RENAME_CALLBACK_PREFIX}:(.+):(\\d+)$`,
      ).exec(data);

      if (!match) {
        return;
      }

      const [, sessionId] = match;
      await promptSessionRename({
        ctx,
        sessionId,
        pendingSessionRenameState,
        sessions,
        source: 'history',
      });
    },
  );

  bot.action(
    new RegExp(`^${FINISHED_SESSION_BACK_CALLBACK_PREFIX}:\\d+$`),
    async (ctx) => {
      await ctx.answerCbQuery();

      const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
      const match = new RegExp(
        `^${FINISHED_SESSION_BACK_CALLBACK_PREFIX}:(\\d+)$`,
      ).exec(data);

      if (!match) {
        return;
      }

      const [, page] = match;
      const result = await getLibraryHistoryUseCase.execute(getUserId(ctx));

      if (result.kind === 'empty') {
        return ctx.editMessageText(messages.library.historyEmpty, {
          reply_markup: {
            inline_keyboard: [],
          },
        });
      }

      return ctx.editMessageText(
        buildLibraryHistoryReply(result.items, Number(page)),
        buildLibraryHistoryInlineKeyboard(result.items, Number(page)),
      );
    },
  );
}
