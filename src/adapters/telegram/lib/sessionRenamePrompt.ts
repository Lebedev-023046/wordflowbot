import type { Context } from 'telegraf';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { messages } from '../../../shared/i18n/messages';
import { resolveSessionTitle } from '../../../shared/utils/sessionTitle';
import { getUserId } from './getUserId';
import type {
  PendingSessionRenameStore,
  SessionRenameSource,
} from './pendingSessionRenameState';

export async function promptSessionRename(params: {
  ctx: Context;
  historyPage?: number;
  sessionId: string;
  pendingSessionRenameState: PendingSessionRenameStore;
  sessions: SessionRepository;
  source: SessionRenameSource;
}) {
  const {
    ctx,
    historyPage,
    sessionId,
    pendingSessionRenameState,
    sessions,
    source,
  } = params;
  const userId = getUserId(ctx);
  const session = await sessions.findFinishedSessionById(userId, sessionId);

  if (!session) {
    await ctx.reply(messages.library.sessionMissing);
    return false;
  }

  const currentTitle = resolveSessionTitle(session);
  const prompt = await ctx.reply(messages.library.renamePrompt(currentTitle), {
    reply_markup: {
      force_reply: true,
      input_field_placeholder: currentTitle,
      selective: true,
    },
  });

  pendingSessionRenameState.set(userId, {
    historyPage,
    promptMessageId: prompt.message_id,
    sessionId,
    source,
  });

  return true;
}
