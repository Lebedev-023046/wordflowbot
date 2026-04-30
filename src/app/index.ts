import { createBot } from './bootstrap/createBot';
import { createContainer } from './bootstrap/createContainer';
import { createHealthServer } from './bootstrap/createHealthServer';
import { registerHandlers } from './bootstrap/registerHandlers';
import { env } from './config/env';

const bot = createBot();
const container = createContainer();
const healthServer = createHealthServer({
  port: env.healthPort,
});

registerHandlers(bot, container);

await healthServer.listen();
await bot.telegram.getMe();
await bot.launch();
healthServer.setReady(true);

process.once('SIGINT', async () => {
  healthServer.setReady(false);
  await healthServer.close();
  await container.prisma.$disconnect();
  bot.stop('SIGINT');
});

process.once('SIGTERM', async () => {
  healthServer.setReady(false);
  await healthServer.close();
  await container.prisma.$disconnect();
  bot.stop('SIGTERM');
});
