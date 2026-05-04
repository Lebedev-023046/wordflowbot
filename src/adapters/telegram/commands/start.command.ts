import type { Context, Telegraf } from 'telegraf';
import type { StartSessionUseCase } from '../../../application/session/commands/StartSessionUseCase';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getHomeScreenState } from '../lib/getHomeScreenState';
import { getUserId } from '../lib/getUserId';
import { replyWithHomeScreenState } from '../lib/replyWithHomeScreenState';
import { replyWithSessionState } from '../lib/replyWithSessionState';

export function registerStartCommand(
  bot: Telegraf,
  entries: EntryRepository,
  sessions: SessionRepository,
  startSessionUseCase: StartSessionUseCase,
) {
  const showStartState = async (ctx: Context) => {
    const state = await getHomeScreenState(entries, sessions, getUserId(ctx));

    return replyWithHomeScreenState(ctx, state);
  };

  bot.start(showStartState);

  bot.hears(buttons.startSession, async (ctx) => {
    const userId = getUserId(ctx);
    const result = await startSessionUseCase.execute(userId);

    if (result.kind === 'alreadyActive') {
      const state = await getHomeScreenState(
        entries,
        sessions,
        userId,
        messages.session.alreadyActive,
      );

      return replyWithSessionState({
        ctx,
        hasEntries: state.hasEntries,
        hasFailedEntries: state.hasFailedEntries,
        message: state.message,
        isActive: state.isActive,
      });
    }

    return replyWithSessionState({
      ctx,
      message: messages.session.started,
      isActive: result.isActive,
    });
  });
}
