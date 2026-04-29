import type { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import type { EnrichmentJobQueue } from '../../../application/ports/EnrichmentJobQueue';
import type { IntakeEntriesUseCase } from '../../../application/use-cases/IntakeEntriesUseCase';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { renderSessionKeyboard } from '../lib/sessionKeyboard';
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
) {
  const ignoredButtonTexts = new Set([
    buttons.clearSession,
    buttons.exportCsv,
    buttons.retryFailed,
    buttons.showWords,
    buttons.startSession,
    buttons.stopSession,
  ]);

  bot.on(message('text'), async (ctx) => {
    const text = ctx.message.text;

    if (ignoredButtonTexts.has(text)) {
      return;
    }

    const userId = getUserId(ctx);
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
