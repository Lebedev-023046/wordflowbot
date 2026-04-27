import { createBot } from './bootstrap/createBot';
import { registerHandlers } from './bootstrap/registerHandlers';

const bot = createBot();

registerHandlers(bot);

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
