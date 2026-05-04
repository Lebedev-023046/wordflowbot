import type { Context } from 'telegraf';
import type { HomeScreenState } from './getHomeScreenState';
import { renderHomeKeyboard } from './homeKeyboard';

export function replyWithHomeScreenState(ctx: Context, state: HomeScreenState) {
  return ctx.reply(state.message, renderHomeKeyboard(state.mode));
}
