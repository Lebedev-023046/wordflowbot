import type { Context, Telegraf } from 'telegraf';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { getUserId } from '../lib/getUserId';
import { renderSessionKeyboard } from '../lib/sessionKeyboard';

export function registerStartCommand(bot: Telegraf, sessions: SessionRepository) {
  const showStartState = (ctx: Context) => {
    const userId = getUserId(ctx);
    const isActive = sessions.hasActiveSession(userId);

    const message = isActive
      ? 'Session is active. Send words or phrases.'
      : 'Press Start session to begin.';

    return ctx.reply(message, renderSessionKeyboard({ isActive }));
  };

  bot.start(showStartState);

  bot.hears('Start session', (ctx) => {
    const userId = getUserId(ctx);

    if (sessions.hasActiveSession(userId)) {
      return ctx.reply('Session already active.', renderSessionKeyboard({ isActive: true }));
    }

    sessions.startSession(userId);

    return ctx.reply(
      'Session started. Send words or phrases.',
      renderSessionKeyboard({ isActive: true }),
    );
  });
}
