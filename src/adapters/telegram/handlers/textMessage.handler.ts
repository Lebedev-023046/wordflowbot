import type { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import type { EnrichmentJobQueue } from '../../../application/ports/EnrichmentJobQueue';
import type { IntakeEntriesUseCase } from '../../../application/use-cases/IntakeEntriesUseCase';
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
  sessions: SessionRepository,
  intakeEntriesUseCase: IntakeEntriesUseCase,
  enrichmentJobQueue: EnrichmentJobQueue,
) {
  bot.on(message('text'), async (ctx) => {
    const text = ctx.message.text;

    if (text === buttons.startSession || text === buttons.stopSession) {
      return;
    }

    const userId = getUserId(ctx);
    const session = sessions.getActiveSession(userId);

    if (!session) {
      return ctx.reply(messages.session.idle, renderSessionKeyboard(false));
    }

    const result = intakeEntriesUseCase.execute({
      sessionId: session.id,
      text,
    });

    if (result.kind !== 'saved') {
      return ctx.reply(getInitialReplyText(result));
    }

    await ctx.reply(getInitialReplyText(result));

    const processedEntries = await enrichmentJobQueue.enqueue(result.entries);

    if (processedEntries.succeeded.length === 0) {
      return ctx.reply(getProcessedFailuresReplyText(processedEntries));
    }

    return ctx.reply(formatProcessedEntriesReply(processedEntries));
  });
}
