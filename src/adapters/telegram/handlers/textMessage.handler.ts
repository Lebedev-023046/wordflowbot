import type { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import type { EntryEnrichmentClient } from '../../../entities/entry/api/entryEnrichmentClient';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { handleTextEntries } from '../../../features/intake-entries/model/handleTextEntries';
import { processEntries } from '../../../processes/entry-enrichment/model/processEntries';
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
  entryEnrichmentClient: EntryEnrichmentClient,
  sessions: SessionRepository,
  entries: EntryRepository,
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

    const result = handleTextEntries({
      entryRepository: entries,
      sessionId: session.id,
      text,
    });

    if (result.kind !== 'saved') {
      return ctx.reply(getInitialReplyText(result));
    }

    await ctx.reply(getInitialReplyText(result));

    const processedEntries = await processEntries({
      entries: result.entries,
      entryEnrichmentClient,
      entryRepository: entries,
    });

    if (processedEntries.succeeded.length === 0) {
      return ctx.reply(getProcessedFailuresReplyText(processedEntries));
    }

    return ctx.reply(formatProcessedEntriesReply(processedEntries));
  });
}
