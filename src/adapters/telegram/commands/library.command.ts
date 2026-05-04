import { Input, Markup, type Context, type Telegraf } from 'telegraf';
import type {
  ExportFinishedSessionCsvFilter,
  ExportFinishedSessionCsvUseCase,
} from '../../../application/export/commands/ExportFinishedSessionCsvUseCase';
import type { GetFinishedSessionWordsUseCase } from '../../../application/library/queries/GetFinishedSessionWordsUseCase';
import type { GetLibraryHistoryUseCase } from '../../../application/library/queries/GetLibraryHistoryUseCase';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import {
  buildFinishedSessionWordsInlineKeyboard,
  buildFinishedSessionWordsReply,
  FINISHED_SESSION_BACK_CALLBACK_PREFIX,
  FINISHED_SESSION_EXPORT_CALLBACK_PREFIX,
  FINISHED_SESSION_RENAME_CALLBACK_PREFIX,
  FINISHED_SESSION_WORDS_NOOP_CALLBACK,
  parseFinishedSessionWordsCallbackData,
} from '../lib/finishedSessionWordsPagination';
import { getHomeScreenState } from '../lib/getHomeScreenState';
import { getUserId } from '../lib/getUserId';
import {
  buildLibraryHistoryInlineKeyboard,
  buildLibraryHistoryReply,
  LIBRARY_HISTORY_NOOP_CALLBACK,
  parseLibraryHistoryCallbackData,
} from '../lib/libraryHistoryPagination';
import type { PendingSessionRenameStore } from '../lib/pendingSessionRenameState';
import { replyWithFinishedSessionDetail } from '../lib/replyWithFinishedSessionDetail';
import { replyWithHomeScreenState } from '../lib/replyWithHomeScreenState';
import { promptSessionRename } from '../lib/sessionRenamePrompt';

const FINISHED_SESSION_EXPORT_FILTER_CALLBACK_PREFIX = 'fsex';
const EMPTY_INLINE_KEYBOARD = { reply_markup: { inline_keyboard: [] } };
const FINISHED_SESSION_EXPORT_FILTER_BUTTONS: Array<{
  filter: ExportFinishedSessionCsvFilter;
  label: string;
}> = [
  { filter: 'A', label: buttons.exportCsvMostUseful },
  { filter: 'B', label: buttons.exportCsvGoodToKnow },
  { filter: 'C', label: buttons.exportCsvRarelyUsed },
  { filter: 'all', label: buttons.exportCsvAllWords },
];

function buildFinishedSessionExportInlineKeyboard(
  sessionId: string,
  historyPage: number,
) {
  return Markup.inlineKeyboard([
    FINISHED_SESSION_EXPORT_FILTER_BUTTONS.slice(0, 2).map(
      ({ filter, label }) =>
        Markup.button.callback(
          label,
          createFinishedSessionExportFilterCallbackData(
            sessionId,
            historyPage,
            filter,
          ),
        ),
    ),
    FINISHED_SESSION_EXPORT_FILTER_BUTTONS.slice(2).map(({ filter, label }) =>
      Markup.button.callback(
        label,
        createFinishedSessionExportFilterCallbackData(
          sessionId,
          historyPage,
          filter,
        ),
      ),
    ),
  ]);
}

function createFinishedSessionExportFilterCallbackData(
  sessionId: string,
  historyPage: number,
  filter: ExportFinishedSessionCsvFilter,
) {
  return `${FINISHED_SESSION_EXPORT_FILTER_CALLBACK_PREFIX}:${sessionId}:${historyPage}:${filter}`;
}

function getFinishedSessionExportFilterLabel(
  filter: Exclude<ExportFinishedSessionCsvFilter, 'all'>,
): string {
  const match = FINISHED_SESSION_EXPORT_FILTER_BUTTONS.find(
    (button) => button.filter === filter,
  );

  if (!match) {
    throw new Error(`Unsupported export filter: ${filter}`);
  }

  return match.label;
}

export function registerLibraryCommand(
  bot: Telegraf,
  entries: EntryRepository,
  sessions: SessionRepository,
  getLibraryHistoryUseCase: GetLibraryHistoryUseCase,
  getFinishedSessionWordsUseCase: GetFinishedSessionWordsUseCase,
  exportFinishedSessionCsvUseCase: ExportFinishedSessionCsvUseCase,
  pendingSessionRenameState: PendingSessionRenameStore,
) {
  const handleHistory = async (ctx: Context) => {
    const result = await getLibraryHistoryUseCase.execute(getUserId(ctx));

    if (result.kind === 'empty') {
      return replyWithHomeScreenState(
        ctx,
        await getHomeScreenState(entries, sessions, getUserId(ctx)),
      );
    }

    return ctx.reply(
      buildLibraryHistoryReply(result.items, 0),
      buildLibraryHistoryInlineKeyboard(result.items, 0),
    );
  };

  bot.hears(buttons.myLibrary, handleHistory);

  bot.hears(buttons.back, async (ctx) => {
    const state = await getHomeScreenState(entries, sessions, getUserId(ctx));

    return replyWithHomeScreenState(ctx, state);
  });

  bot.hears(buttons.openLastSession, async (ctx) => {
    const history = await getLibraryHistoryUseCase.execute(getUserId(ctx));

    if (history.kind === 'empty') {
      return replyWithHomeScreenState(
        ctx,
        await getHomeScreenState(entries, sessions, getUserId(ctx)),
      );
    }

    return replyWithFinishedSessionDetail({
      ctx,
      getFinishedSessionWordsUseCase,
      historyPage: 0,
      sessionId: history.items[0].id,
    });
  });

  bot.action(LIBRARY_HISTORY_NOOP_CALLBACK, async (ctx) => {
    await ctx.answerCbQuery();
  });

  bot.action(FINISHED_SESSION_WORDS_NOOP_CALLBACK, async (ctx) => {
    await ctx.answerCbQuery();
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

    const [, sessionId, page] = match;
    await promptSessionRename({
      ctx,
      historyPage: Number(page),
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
    return replyWithFinishedSessionDetail({
      ctx,
      getFinishedSessionWordsUseCase,
      historyPage: Number(page),
      sessionId,
    });
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
        `${result.title}\n\n${messages.library.sessionWordsEmpty}`,
        EMPTY_INLINE_KEYBOARD,
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

      const [, sessionId, page] = match;
      await promptSessionRename({
        ctx,
        historyPage: Number(page),
        sessionId,
        pendingSessionRenameState,
        sessions,
        source: 'history',
      });
    },
  );

  bot.action(
    new RegExp(`^${FINISHED_SESSION_EXPORT_CALLBACK_PREFIX}:.+:\\d+$`),
    async (ctx) => {
      await ctx.answerCbQuery();

      const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
      const match = new RegExp(
        `^${FINISHED_SESSION_EXPORT_CALLBACK_PREFIX}:(.+):(\\d+)$`,
      ).exec(data);

      if (!match) {
        return;
      }

      const [, sessionId, historyPage] = match;

      return ctx.reply(
        messages.session.exportChoose,
        buildFinishedSessionExportInlineKeyboard(
          sessionId,
          Number(historyPage),
        ),
      );
    },
  );

  bot.action(/^fsex:.+:\d+:(all|A|B|C)$/, async (ctx) => {
    await ctx.answerCbQuery();

    const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
    const match = /^fsex:(.+):(\d+):(all|A|B|C)$/.exec(data);

    if (!match) {
      return;
    }

    const [, sessionId, , filter] = match;
    const result = await exportFinishedSessionCsvUseCase.execute(
      getUserId(ctx),
      sessionId,
      filter as ExportFinishedSessionCsvFilter,
    );

    if (result.kind === 'missing') {
      return ctx.editMessageText(
        messages.library.sessionMissing,
        EMPTY_INLINE_KEYBOARD,
      );
    }

    if (result.kind === 'empty') {
      return ctx.editMessageText(
        filter === 'all'
          ? messages.session.emptyExport
          : messages.session.emptyExportForFilter(
              getFinishedSessionExportFilterLabel(
                filter as Exclude<ExportFinishedSessionCsvFilter, 'all'>,
              ),
            ),
        EMPTY_INLINE_KEYBOARD,
      );
    }

    return ctx.replyWithDocument(
      Input.fromBuffer(
        Buffer.from(`\uFEFF${result.content}`, 'utf8'),
        result.fileName,
      ),
    );
  });

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
