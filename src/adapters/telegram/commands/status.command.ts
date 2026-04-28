import type { Telegraf } from 'telegraf';
import type { GetSessionStatusUseCase } from '../../../application/use-cases/GetSessionStatusUseCase';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { replyWithSessionState } from '../lib/replyWithSessionState';

export function registerStatusCommand(
  bot: Telegraf,
  getSessionStatusUseCase: GetSessionStatusUseCase,
) {
  bot.command('status', async (ctx) => {
    const userId = getUserId(ctx);
    const result = await getSessionStatusUseCase.execute(userId);

    if (result.kind === 'noActive') {
      return replyWithSessionState({
        ctx,
        message: messages.session.noActive,
        isActive: false,
      });
    }

    return replyWithSessionState({
      ctx,
      hasEntries: result.totalEntries > 0,
      hasFailedEntries: result.failedEntriesCount > 0,
      message: messages.status.active(result),
      isActive: true,
    });
  });
}
