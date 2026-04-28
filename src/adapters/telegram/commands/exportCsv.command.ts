import { Input, type Telegraf } from 'telegraf';
import type { ExportSessionCsvUseCase } from '../../../application/use-cases/ExportSessionCsvUseCase';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { replyWithSessionState } from '../lib/replyWithSessionState';

export function registerExportCsvCommand(
  bot: Telegraf,
  exportSessionCsvUseCase: ExportSessionCsvUseCase,
) {
  bot.hears(buttons.exportCsv, async (ctx) => {
    const userId = getUserId(ctx);
    const result = exportSessionCsvUseCase.execute(userId);

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
        message: messages.session.emptyExport,
      });
    }

    return ctx.replyWithDocument(
      Input.fromBuffer(Buffer.from(`\uFEFF${result.content}`, 'utf8'), result.fileName),
    );
  });
}
