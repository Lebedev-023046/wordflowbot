import type { Telegraf } from 'telegraf';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { getUserId } from '../lib/getUserId';
import { renderSessionKeyboard } from '../lib/sessionKeyboard';

export function registerStopCommand(bot: Telegraf, sessions: SessionRepository) {
  bot.hears('Stop session', (ctx) => {
    const userId = getUserId(ctx);

    if (!sessions.hasActiveSession(userId)) {
      return ctx.reply('No active session.', renderSessionKeyboard({ isActive: false }));
    }

    sessions.stopSession(userId);

    return ctx.reply('Session stopped.', renderSessionKeyboard({ isActive: false }));
  });
}
