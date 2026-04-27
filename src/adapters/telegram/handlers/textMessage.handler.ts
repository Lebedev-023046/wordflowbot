import type { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { getUserId } from '../lib/getUserId';
import { renderSessionKeyboard } from '../lib/sessionKeyboard';

export function registerTextMessageHandler(bot: Telegraf, sessions: SessionRepository) {
  bot.on(message('text'), (ctx) => {
    const text = ctx.message.text;

    if (text === 'Start session' || text === 'Stop session') {
      return;
    }

    const userId = getUserId(ctx);

    if (!sessions.hasActiveSession(userId)) {
      return ctx.reply('Press Start session first.', renderSessionKeyboard({ isActive: false }));
    }

    return ctx.reply(`Saved: ${text}`);
  });
}
