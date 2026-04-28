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
  debugBot: process.env.DEBUG_BOT === 'true',
  enrichmentCacheFile:
    process.env.ENRICHMENT_CACHE_FILE ?? '.data/enrichment-cache.json',
  logCache: process.env.LOG_CACHE === 'true',
  openAiApiKey: process.env.OPENAI_API_KEY ?? '',
  openAiModel: process.env.OPENAI_MODEL ?? 'gpt-5.4-mini',
  openAiServiceTier: getOpenAiServiceTier(),
  logUsage: process.env.LOG_USAGE === 'true',
};

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
