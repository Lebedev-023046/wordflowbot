import type { Context } from 'telegraf';

export function getUserId(ctx: Context): number {
  if (!ctx.from) {
    throw new Error('Telegram user is missing in context.');
  }

  return ctx.from.id;
}
