import type { Context, Telegraf } from 'telegraf';
import type { RetryFailedEntriesUseCase } from '../../../application/entries/commands/RetryFailedEntriesUseCase';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import {
  formatProcessedEntriesReply,
  getProcessedFailuresReplyText,
} from '../handlers/textMessage.helpers';
import { getUserId } from '../lib/getUserId';
import { replyWithSessionState } from '../lib/replyWithSessionState';
import { renderSessionKeyboard } from '../lib/sessionKeyboard';

export function registerRetryFailedCommand(
  bot: Telegraf,
  entries: EntryRepository,
  sessions: SessionRepository,
  retryFailedEntriesUseCase: RetryFailedEntriesUseCase,
) {
  const handleRetry = async (ctx: Context) => {
    const userId = getUserId(ctx);
    const result = await retryFailedEntriesUseCase.execute(userId);

    if (result.kind === 'noActive') {
      return replyWithSessionState({
        ctx,
        isActive: false,
        message: messages.session.noActive,
      });
    }

    if (result.kind === 'noFailed') {
      const session = await sessions.getActiveSession(userId);
      return replyWithSessionState({
        ctx,
        hasEntries: session ? await hasEntries(entries, session.id) : false,
        hasFailedEntries: session
          ? await hasFailedEntries(entries, session.id)
          : false,
        isActive: true,
        message: messages.entries.retryNothingFailed,
      });
    }

    await ctx.reply(messages.entries.retrying(result.retryCount));

    if (result.processingResult.succeeded.length === 0) {
      const session = await sessions.getActiveSession(userId);
      return ctx.reply(
        getProcessedFailuresReplyText(result.processingResult),
        session
          ? renderSessionKeyboard(
              true,
              await hasEntries(entries, session.id),
              await hasFailedEntries(entries, session.id),
            )
          : undefined,
      );
    }

    const session = await sessions.getActiveSession(userId);
    return ctx.reply(
      formatProcessedEntriesReply(result.processingResult),
      session
        ? renderSessionKeyboard(
            true,
            await hasEntries(entries, session.id),
            await hasFailedEntries(entries, session.id),
          )
        : undefined,
    );
  };

  bot.command('retry_failed', handleRetry);
  bot.hears(buttons.retryFailed, handleRetry);
}

function hasFailedEntries(
  entryRepository: EntryRepository,
  sessionId: string,
): Promise<boolean> {
  return hasFailedEntriesInternal(entryRepository, sessionId);
}

async function hasFailedEntriesInternal(
  entryRepository: EntryRepository,
  sessionId: string,
): Promise<boolean> {
  return (await entryRepository.findBySessionId(sessionId)).some(
    (entry) => entry.status === 'failed',
  );
}

function hasEntries(
  entryRepository: EntryRepository,
  sessionId: string,
): Promise<boolean> {
  return hasEntriesInternal(entryRepository, sessionId);
}

async function hasEntriesInternal(
  entryRepository: EntryRepository,
  sessionId: string,
): Promise<boolean> {
  return (await entryRepository.findBySessionId(sessionId)).length > 0;
}
