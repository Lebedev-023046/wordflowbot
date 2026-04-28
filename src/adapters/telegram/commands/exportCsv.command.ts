import { Input, type Telegraf } from 'telegraf';
import type { ExportSessionCsvUseCase } from '../../../application/use-cases/ExportSessionCsvUseCase';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { replyWithSessionState } from '../lib/replyWithSessionState';

export function registerExportCsvCommand(
  bot: Telegraf,
  entries: EntryRepository,
  sessions: SessionRepository,
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
      const session = sessions.getActiveSession(userId);
      return replyWithSessionState({
        ctx,
        hasEntries: session ? hasEntries(entries, session.id) : false,
        hasFailedEntries: session
          ? hasFailedEntries(entries, session.id)
          : false,
        isActive: true,
        message: messages.session.emptyExport,
      });
    }

    return ctx.replyWithDocument(
      Input.fromBuffer(
        Buffer.from(`\uFEFF${result.content}`, 'utf8'),
        result.fileName,
      ),
    );
  });
}

function hasFailedEntries(
  entryRepository: EntryRepository,
  sessionId: string,
): boolean {
  return entryRepository
    .findBySessionId(sessionId)
    .some((entry) => entry.status === 'failed');
}

function hasEntries(
  entryRepository: EntryRepository,
  sessionId: string,
): boolean {
  return entryRepository.findBySessionId(sessionId).length > 0;
}
