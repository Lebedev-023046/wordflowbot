import type { Telegraf } from 'telegraf';
import { CachedEntryEnrichmentClient } from '../../adapters/ai/CachedEntryEnrichmentClient';
import { OpenAIEnrichmentClient } from '../../adapters/ai/OpenAIEnrichmentClient';
import { InMemoryEntryRepository } from '../../adapters/storage/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../adapters/storage/InMemorySessionRepository';
import { registerStartCommand } from '../../adapters/telegram/commands/start.command';
import { registerStatusCommand } from '../../adapters/telegram/commands/status.command';
import { registerStopCommand } from '../../adapters/telegram/commands/stop.command';
import { registerTextMessageHandler } from '../../adapters/telegram/handlers/textMessage.handler';
import { createLogger } from '../../shared/logging/logger';
import { env } from '../config/env';

export function registerHandlers(bot: Telegraf) {
  const openAiDebugLogger = createLogger({
    infoEnabled: env.debugBot,
    scope: 'OpenAIEnrichmentClient',
  });
  const usageLogger = createLogger({
    infoEnabled: env.logUsage,
    scope: 'OpenAIEnrichmentClient',
  });
  const cacheLogger = createLogger({
    infoEnabled: env.logCache,
    scope: 'CachedEntryEnrichmentClient',
  });
  const openAiEnrichmentClient = new OpenAIEnrichmentClient({
    apiKey: env.openAiApiKey,
    debugLogger: openAiDebugLogger,
    model: env.openAiModel,
    serviceTier: env.openAiServiceTier,
    usageLogger,
  });
  const entryEnrichmentClient = new CachedEntryEnrichmentClient({
    cacheFilePath: env.enrichmentCacheFile,
    delegate: openAiEnrichmentClient,
    logger: cacheLogger,
  });
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();

  registerStartCommand(bot, sessions);
  registerStatusCommand(bot, sessions, entries);
  registerStopCommand(bot, sessions);
  registerTextMessageHandler(bot, entryEnrichmentClient, sessions, entries);
}
