import type { Context } from 'telegraf';
import type { RenameSessionUseCase } from '../../../application/session/commands/RenameSessionUseCase';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from './getUserId';
import { renderLibraryKeyboard } from './libraryKeyboard';
import { replyWithSessionState } from './replyWithSessionState';
import type { PendingSessionRenameStore } from './pendingSessionRenameState';

export async function handleSessionRenameReply(params: {
  ctx: Context;
  renameSessionUseCase: RenameSessionUseCase;
  pendingSessionRenameState: PendingSessionRenameStore;
}): Promise<boolean> {
  const { ctx, renameSessionUseCase, pendingSessionRenameState } = params;
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
    await ctx.reply(
      messages.library.renamed(renameResult.title),
      renderLibraryKeyboard(),
    );
    return true;
  }

  await replyWithSessionState({
    ctx,
    isActive: false,
    message: messages.library.renamed(renameResult.title),
  });

  return true;
}
