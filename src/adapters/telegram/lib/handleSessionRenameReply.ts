import type { Context } from 'telegraf';
import type { GetFinishedSessionWordsUseCase } from '../../../application/library/queries/GetFinishedSessionWordsUseCase';
import type { RenameSessionUseCase } from '../../../application/session/commands/RenameSessionUseCase';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from './getUserId';
import { replyWithSessionState } from './replyWithSessionState';
import type { PendingSessionRenameStore } from './pendingSessionRenameState';
import { replyWithFinishedSessionDetail } from './replyWithFinishedSessionDetail';

export async function handleSessionRenameReply(params: {
  ctx: Context;
  getFinishedSessionWordsUseCase: GetFinishedSessionWordsUseCase;
  renameSessionUseCase: RenameSessionUseCase;
  pendingSessionRenameState: PendingSessionRenameStore;
}): Promise<boolean> {
  const {
    ctx,
    getFinishedSessionWordsUseCase,
    renameSessionUseCase,
    pendingSessionRenameState,
  } = params;
  const pendingRename = pendingSessionRenameState.get(getUserId(ctx));

  if (
    !pendingRename ||
    ctx.message === undefined ||
    !('reply_to_message' in ctx.message) ||
    ctx.message.reply_to_message?.message_id !==
      pendingRename.promptMessageId ||
    !('text' in ctx.message)
  ) {
    return false;
  }

  const renameResult = await renameSessionUseCase.execute(
    getUserId(ctx),
    pendingRename.sessionId,
    ctx.message.text,
  );

  if (renameResult.kind === 'emptyTitle') {
    await ctx.reply(messages.rename.empty);
    return true;
  }

  pendingSessionRenameState.clear(getUserId(ctx));

  if (renameResult.kind === 'notFound') {
    await ctx.reply(messages.library.sessionMissing);
    return true;
  }

  if (pendingRename.source === 'history') {
    await replyWithFinishedSessionDetail({
      ctx,
      getFinishedSessionWordsUseCase,
      historyPage: pendingRename.historyPage ?? 0,
      sessionId: pendingRename.sessionId,
    });
    return true;
  }

  await replyWithSessionState({
    ctx,
    isActive: false,
    message: messages.library.renamed(renameResult.title),
  });

  return true;
}
