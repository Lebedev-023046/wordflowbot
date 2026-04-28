import type { Context, Telegraf } from 'telegraf';
import type { RetryFailedEntriesUseCase } from '../../../application/use-cases/RetryFailedEntriesUseCase';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import {
  formatProcessedEntriesReply,
  getProcessedFailuresReplyText,
} from '../handlers/textMessage.helpers';
import { getUserId } from '../lib/getUserId';
import { replyWithSessionState } from '../lib/replyWithSessionState';

export function registerRetryFailedCommand(
  bot: Telegraf,
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
      return replyWithSessionState({
        ctx,
        isActive: true,
        message: messages.entries.retryNothingFailed,
      });
    }

    await ctx.reply(messages.entries.retrying(result.retryCount));

    if (result.processingResult.succeeded.length === 0) {
      return ctx.reply(getProcessedFailuresReplyText(result.processingResult));
    }

    return ctx.reply(formatProcessedEntriesReply(result.processingResult));
  };

  bot.command('retry_failed', handleRetry);
  bot.hears(buttons.retryFailed, handleRetry);
}
