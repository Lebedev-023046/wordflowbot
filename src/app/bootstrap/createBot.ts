import { Telegraf } from 'telegraf';
import { createLogger } from '../../shared/logging/logger';
import { env } from '../config/env';

export function createBot() {
  const bot = new Telegraf(env.botToken);
  const logger = createLogger({
    scope: 'Telegram',
  });

  bot.catch((error, ctx) => {
    logger.error('Unhandled bot error.', {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      messageText: 'message' in ctx && ctx.message && 'text' in ctx.message ? ctx.message.text : null,
      updateId: ctx.update.update_id,
    });
  });

  return bot;
}
