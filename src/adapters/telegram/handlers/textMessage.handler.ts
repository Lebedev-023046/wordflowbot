import type { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import type { EnrichmentJobQueue } from '../../../application/ports/EnrichmentJobQueue';
import type { AddEntriesFromTextUseCase } from '../../../application/entries/commands/AddEntriesFromTextUseCase';
import type { GetFinishedSessionWordsUseCase } from '../../../application/library/queries/GetFinishedSessionWordsUseCase';
import type { RenameSessionUseCase } from '../../../application/session/commands/RenameSessionUseCase';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { buttons, type ButtonText } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { handleSessionRenameReply } from '../lib/handleSessionRenameReply';
import { renderSessionKeyboard } from '../lib/sessionKeyboard';
import type { PendingSessionRenameStore } from '../lib/pendingSessionRenameState';
import {
  formatProcessedEntriesReply,
  getInitialReplyText,
  getProcessedFailuresReplyText,
} from './textMessage.helpers';

export function registerTextMessageHandler(
  bot: Telegraf,
  entries: EntryRepository,
  sessions: SessionRepository,
  addEntriesFromTextUseCase: AddEntriesFromTextUseCase,
  enrichmentJobQueue: EnrichmentJobQueue,
  getFinishedSessionWordsUseCase: GetFinishedSessionWordsUseCase,
  renameSessionUseCase: RenameSessionUseCase,
  pendingSessionRenameState: PendingSessionRenameStore,
) {
  const ignoredButtonTexts = new Set<ButtonText>([
    buttons.back,
    buttons.clearSession,
    buttons.exportCsv,
    buttons.myLibrary,
    buttons.openLastSession,
    buttons.retryFailed,
    buttons.showWords,
    buttons.startSession,
    buttons.stopSession,
  ]);

  bot.on(message('text'), async (ctx) => {
    if (
      await handleSessionRenameReply({
        ctx,
        getFinishedSessionWordsUseCase,
        renameSessionUseCase,
        pendingSessionRenameState,
      })
    ) {
      return;
    }

    const text = ctx.message.text as ButtonText;
    const userId = getUserId(ctx);

    if (ignoredButtonTexts.has(text)) {
      return;
    }

    const session = await sessions.getActiveSession(userId);

    if (!session) {
      return ctx.reply(messages.session.idle, renderSessionKeyboard(false));
    }

    const result = await addEntriesFromTextUseCase.execute({
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
