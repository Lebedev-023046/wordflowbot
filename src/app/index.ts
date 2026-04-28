import { createBot } from './bootstrap/createBot';
import { createContainer } from './bootstrap/createContainer';
import { registerHandlers } from './bootstrap/registerHandlers';

const bot = createBot();
const container = createContainer();

registerHandlers(bot, container);

bot.launch();

process.once('SIGINT', async () => {
  await container.prisma.$disconnect();
  bot.stop('SIGINT');
});

process.once('SIGTERM', async () => {
  await container.prisma.$disconnect();
  bot.stop('SIGTERM');
});
