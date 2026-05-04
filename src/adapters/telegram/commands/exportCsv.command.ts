import { Input, type Telegraf } from 'telegraf';
import { Markup } from 'telegraf';
import type {
  ExportSessionCsvFilter,
  ExportSessionCsvUseCase,
} from '../../../application/export/commands/ExportSessionCsvUseCase';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { replyWithSessionState } from '../lib/replyWithSessionState';

const EXPORT_CALLBACK_PREFIX = 'export_csv';

const EXPORT_FILTER_BUTTONS: Array<{
  filter: ExportSessionCsvFilter;
  label: string;
}> = [
  { filter: 'all', label: buttons.exportCsvAllWords },
  { filter: 'A', label: buttons.exportCsvMostUseful },
  { filter: 'B', label: buttons.exportCsvGoodToKnow },
  { filter: 'C', label: buttons.exportCsvRarelyUsed },
];
const EMPTY_INLINE_KEYBOARD = { reply_markup: { inline_keyboard: [] } };

function buildExportInlineKeyboard() {
  return Markup.inlineKeyboard([
    EXPORT_FILTER_BUTTONS.slice(1, 3).map(({ filter, label }) =>
      Markup.button.callback(label, createExportCallbackData(filter)),
    ),
    [
      Markup.button.callback(
        EXPORT_FILTER_BUTTONS[3].label,
        createExportCallbackData(EXPORT_FILTER_BUTTONS[3].filter),
      ),
      Markup.button.callback(
        EXPORT_FILTER_BUTTONS[0].label,
        createExportCallbackData(EXPORT_FILTER_BUTTONS[0].filter),
      ),
    ],
  ]);
}

function createExportCallbackData(filter: ExportSessionCsvFilter): string {
  return `${EXPORT_CALLBACK_PREFIX}:${filter}`;
}

function getExportFilterLabel(
  filter: Exclude<ExportSessionCsvFilter, 'all'>,
): string {
  const match = EXPORT_FILTER_BUTTONS.find(
    (button) => button.filter === filter,
  );

  if (!match) {
    throw new Error(`Unsupported export filter: ${filter}`);
  }

  return match.label;
}

export function registerExportCsvCommand(
  bot: Telegraf,
  _entries: EntryRepository,
  _sessions: SessionRepository,
  exportSessionCsvUseCase: ExportSessionCsvUseCase,
) {
  bot.hears(buttons.exportCsv, async (ctx) => {
    const userId = getUserId(ctx);
    const result = await exportSessionCsvUseCase.execute(userId);

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
        hasEntries: result.hasEntries,
        hasFailedEntries: result.hasFailedEntries,
        isActive: true,
        message: messages.session.emptyExport,
      });
    }

    return ctx.reply(
      messages.session.exportChoose,
      buildExportInlineKeyboard(),
    );
  });

  for (const { filter } of EXPORT_FILTER_BUTTONS) {
    bot.action(createExportCallbackData(filter), async (ctx) => {
      await ctx.answerCbQuery();

      const userId = getUserId(ctx);
      const result = await exportSessionCsvUseCase.execute(userId, filter);

      if (result.kind === 'noActive') {
        return ctx.editMessageText(
          messages.session.noActive,
          EMPTY_INLINE_KEYBOARD,
        );
      }

      if (result.kind === 'empty') {
        return ctx.editMessageText(
          filter === 'all'
            ? messages.session.emptyExport
            : messages.session.emptyExportForFilter(
                getExportFilterLabel(filter),
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
  }
}
