import type { Context, Telegraf } from 'telegraf';
import type { GetSessionWordsUseCase } from '../../../application/use-cases/GetSessionWordsUseCase';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { replyWithSessionState } from '../lib/replyWithSessionState';

export function registerSessionWordsCommand(
  bot: Telegraf,
  getSessionWordsUseCase: GetSessionWordsUseCase,
) {
  const handleShowWords = (ctx: Context) => {
    const userId = getUserId(ctx);
    const result = getSessionWordsUseCase.execute(userId);

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
        message: messages.session.noWordsYet,
      });
    }

    return replyWithSessionState({
      ctx,
      isActive: true,
      message: messages.session.words(result.completedItems, result.failedItems),
    });
  };

  bot.command('words', handleShowWords);
  bot.hears(buttons.showWords, handleShowWords);
}
