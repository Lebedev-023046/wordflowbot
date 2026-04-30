import type { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import type { EnrichmentJobQueue } from '../../../application/ports/EnrichmentJobQueue';
import type { IntakeEntriesUseCase } from '../../../application/use-cases/IntakeEntriesUseCase';
import type { RenameSessionUseCase } from '../../../application/use-cases/RenameSessionUseCase';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { buttons, type ButtonText } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { renderLibraryKeyboard } from '../lib/libraryKeyboard';
import { replyWithSessionState } from '../lib/replyWithSessionState';
import { renderSessionKeyboard } from '../lib/sessionKeyboard';
import type { SessionRenameStateStore } from '../lib/sessionRenameState';
import {
  formatProcessedEntriesReply,
  getInitialReplyText,
  getProcessedFailuresReplyText,
} from './textMessage.helpers';

export function registerTextMessageHandler(
  bot: Telegraf,
  entries: EntryRepository,
  sessions: SessionRepository,
  intakeEntriesUseCase: IntakeEntriesUseCase,
  enrichmentJobQueue: EnrichmentJobQueue,
  renameSessionUseCase: RenameSessionUseCase,
  sessionRenameState: SessionRenameStateStore,
) {
  const ignoredButtonTexts = new Set<ButtonText>([
    buttons.back,
    buttons.clearSession,
    buttons.exportCsv,
    buttons.history,
    buttons.myLibrary,
    buttons.myWords,
    buttons.retryFailed,
    buttons.showWords,
    buttons.startSession,
    buttons.statistics,
    buttons.stopSession,
  ]);

  bot.on(message('text'), async (ctx) => {
    const text = ctx.message.text as ButtonText;
    const userId = getUserId(ctx);
    const pendingRename = sessionRenameState.get(userId);

    if (
      pendingRename &&
      ctx.message.reply_to_message?.message_id === pendingRename.promptMessageId
    ) {
      const renameResult = await renameSessionUseCase.execute(
        userId,
        pendingRename.sessionId,
        text,
      );

      if (renameResult.kind === 'emptyTitle') {
        return ctx.reply(messages.rename.empty);
      }

      sessionRenameState.clear(userId);

      if (renameResult.kind === 'notFound') {
        return ctx.reply(messages.library.sessionMissing);
      }

      if (pendingRename.source === 'history') {
        return ctx.reply(
          messages.library.renamed(renameResult.title),
          renderLibraryKeyboard(),
        );
      }

      return replyWithSessionState({
        ctx,
        isActive: false,
        message: messages.library.renamed(renameResult.title),
      });
    }

    if (ignoredButtonTexts.has(text)) {
      return;
    }

    const session = await sessions.getActiveSession(userId);

    if (!session) {
      return ctx.reply(messages.session.idle, renderSessionKeyboard(false));
    }

    const result = await intakeEntriesUseCase.execute({
      sessionId: session.id,
      text,
    });

    if (result.kind !== 'saved') {
      return ctx.reply(getInitialReplyText(result));
    }

    await ctx.reply(getInitialReplyText(result));

    const processedEntries = await enrichmentJobQueue.enqueue(result.entries);
    const sessionEntries = await entries.findBySessionId(session.id);
    const hasSessionEntries = sessionEntries.length > 0;
    const hasSessionFailures = sessionEntries.some(
      (entry) => entry.status === 'failed',
    );

    if (processedEntries.succeeded.length === 0) {
      return ctx.reply(
        getProcessedFailuresReplyText(processedEntries),
        renderSessionKeyboard(true, hasSessionEntries, hasSessionFailures),
      );
    }

    return ctx.reply(
      formatProcessedEntriesReply(processedEntries),
      renderSessionKeyboard(true, hasSessionEntries, hasSessionFailures),
    );
  });
}
