import type { Context } from 'telegraf';
import { renderSessionKeyboard } from './sessionKeyboard';

interface ReplyWithSessionStateParams {
  ctx: Context;
  isActive: boolean;
  message: string;
}

export function replyWithSessionState({ ctx, isActive, message }: ReplyWithSessionStateParams) {
  return ctx.reply(message, renderSessionKeyboard(isActive));
}
