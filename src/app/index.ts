import { createBot } from './bootstrap/createBot';
import { createContainer } from './bootstrap/createContainer';
import { createHealthServer } from './bootstrap/createHealthServer';
import { registerHandlers } from './bootstrap/registerHandlers';
import { env } from './config/env';

const bot = createBot();
const container = createContainer();
const healthServer = createHealthServer({
  checkDatabase: async () => {
    await container.prisma.$queryRaw`SELECT 1`;
  },
  port: env.healthPort,
});

registerHandlers(bot, container);

await healthServer.listen();
await bot.telegram.getMe();
await bot.telegram.setMyCommands([
  { command: 'start', description: 'Open the home screen' },
  { command: 'words', description: 'Show the current session' },
  { command: 'status', description: 'Show progress and errors' },
  { command: 'retry_failed', description: 'Retry failed words' },
  { command: 'settings', description: 'Change what you are studying' },
  { command: 'help', description: 'How this bot works' },
]);

// bot.launch() resolves only when the bot stops (long polling runs inside
// its returned promise), so it must not be awaited here or readiness would
// never flip to true during normal operation. Startup connectivity is
// already verified above via getMe(); a launch failure after this point is
// fatal and should crash the process so Docker restarts it.
bot.launch().catch((error) => {
  healthServer.setReady(false);
  console.error('Bot failed to launch.', error);
  process.exit(1);
});
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
