import type { Telegraf } from 'telegraf';
import { messages } from '../../../shared/i18n/messages';

export function registerHelpCommand(bot: Telegraf) {
  bot.command('help', async (ctx) => {
    await ctx.reply(messages.help.text);
  });
}
