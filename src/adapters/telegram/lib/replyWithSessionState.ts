import type { Context } from 'telegraf';
import { renderSessionKeyboard } from './sessionKeyboard';

interface ReplyWithSessionStateParams {
  ctx: Context;
  hasEntries?: boolean;
  hasFailedEntries?: boolean;
  isActive: boolean;
  message: string;
}

export function replyWithSessionState({
  ctx,
  hasEntries = false,
  hasFailedEntries = false,
  isActive,
  message,
}: ReplyWithSessionStateParams) {
  return ctx.reply(
    message,
    renderSessionKeyboard(isActive, hasEntries, hasFailedEntries),
  );
}
