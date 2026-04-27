export const env = {
  token: process.env.BOT_TOKEN ?? '',
};

if (!env.token) {
  throw new Error('BOT_TOKEN is missing. Put it into .env before starting the bot.');
}
