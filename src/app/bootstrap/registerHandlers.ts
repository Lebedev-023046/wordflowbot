import type { Telegraf } from 'telegraf';
import { InMemorySessionRepository } from '../../adapters/storage/InMemorySessionRepository';
import { registerStartCommand } from '../../adapters/telegram/commands/start.command';
import { registerStopCommand } from '../../adapters/telegram/commands/stop.command';
import { registerTextMessageHandler } from '../../adapters/telegram/handlers/textMessage.handler';

export function registerHandlers(bot: Telegraf) {
  const sessions = new InMemorySessionRepository();

  registerStartCommand(bot, sessions);
  registerStopCommand(bot, sessions);
  registerTextMessageHandler(bot, sessions);
}
