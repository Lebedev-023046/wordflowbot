import type { Context } from 'telegraf';
import type { GetFinishedSessionWordsUseCase } from '../../../application/library/queries/GetFinishedSessionWordsUseCase';
import { messages } from '../../../shared/i18n/messages';
import {
  buildFinishedSessionWordsInlineKeyboard,
  buildFinishedSessionWordsReply,
} from './finishedSessionWordsPagination';
import { getUserId } from './getUserId';

export async function replyWithFinishedSessionDetail(params: {
  ctx: Context;
  getFinishedSessionWordsUseCase: GetFinishedSessionWordsUseCase;
  historyPage: number;
  sessionId: string;
}) {
  const { ctx, getFinishedSessionWordsUseCase, historyPage, sessionId } =
    params;
  const result = await getFinishedSessionWordsUseCase.execute(
    getUserId(ctx),
    sessionId,
  );

  if (result.kind === 'missing') {
    return ctx.reply(messages.library.sessionMissing);
  }

  if (result.kind === 'empty') {
    return ctx.reply(
      `${result.title}\n\n${messages.library.sessionWordsEmpty}`,
    );
  }

  const initialPageState = {
    aPage: 0,
    bPage: 0,
    cPage: 0,
    failedPage: 0,
    pendingPage: 0,
    view: 'all' as const,
  };

  return ctx.reply(
    buildFinishedSessionWordsReply(
      result.title,
      result.completedItems,
      result.pendingItems,
      result.failedItems,
      initialPageState,
    ),
    buildFinishedSessionWordsInlineKeyboard(
      sessionId,
      historyPage,
      result.completedItems,
      result.pendingItems,
      result.failedItems,
      initialPageState,
    ),
  );
}
