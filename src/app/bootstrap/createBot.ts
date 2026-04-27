import { Telegraf } from 'telegraf';
import { env } from '../config/env';

export function createBot() {
  const bot = new Telegraf(env.token);
  return bot;
}
