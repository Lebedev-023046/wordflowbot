import type { Telegraf } from 'telegraf';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { getSessionStatus } from '../../../features/session-status/model/getSessionStatus';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { replyWithSessionState } from '../lib/replyWithSessionState';

export function registerStatusCommand(
  bot: Telegraf,
  sessions: SessionRepository,
  entries: EntryRepository,
) {
  bot.command('status', (ctx) => {
    const userId = getUserId(ctx);
    const result = getSessionStatus(sessions, entries, userId);

    if (result.kind === 'noActive') {
      return replyWithSessionState({
        ctx,
        message: messages.session.noActive,
        isActive: false,
      });
    }

    return replyWithSessionState({
      ctx,
      message: messages.status.active(result),
      isActive: true,
    });
  });
}
