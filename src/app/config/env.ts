type OpenAIServiceTier = 'auto' | 'default' | 'flex' | 'priority' | 'scale';

function getOpenAiServiceTier(): OpenAIServiceTier {
  const serviceTier = process.env.OPENAI_SERVICE_TIER;

  switch (serviceTier) {
    case 'auto':
    case 'default':
    case 'flex':
    case 'priority':
    case 'scale':
      return serviceTier;
    default:
      return 'flex';
  }
}

export const env = {
  botToken: process.env.BOT_TOKEN ?? '',
  databaseUrl: process.env.DATABASE_URL ?? '',
  debugBot: process.env.DEBUG_BOT === 'true',
  enrichmentConcurrency: getEnrichmentConcurrency(),
  healthPort: getHealthPort(),
  logCache: process.env.LOG_CACHE === 'true',
  openAiApiKey: process.env.OPENAI_API_KEY ?? '',
  openAiModel: process.env.OPENAI_MODEL ?? 'gpt-5.4-mini',
  openAiServiceTier: getOpenAiServiceTier(),
  logUsage: process.env.LOG_USAGE === 'true',
};

function getEnrichmentConcurrency(): number {
  const value = process.env.ENRICHMENT_CONCURRENCY;
  const parsed = Number.parseInt(value ?? '3', 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 3;
  }

  return parsed;
}

function getHealthPort(): number {
  const value = process.env.HEALTH_PORT;
  const parsed = Number.parseInt(value ?? '3001', 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 3001;
  }

  return parsed;
}

if (!env.botToken) {
  throw new Error(
    'BOT_TOKEN is missing. Put it into .env before starting the bot.',
  );
}

if (!env.openAiApiKey) {
  throw new Error(
    'OPENAI_API_KEY is missing. Put it into .env before starting the bot.',
  );
}

if (!env.databaseUrl) {
  throw new Error(
    'DATABASE_URL is missing. Put it into .env before starting the bot.',
  );
}
