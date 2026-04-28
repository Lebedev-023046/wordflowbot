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
  appDbPassword: process.env.APP_DB_PASSWORD ?? '',
  appDbUser: process.env.APP_DB_USER ?? '',
  botToken: process.env.BOT_TOKEN ?? '',
  databaseUrl: process.env.DATABASE_URL ?? '',
  debugBot: process.env.DEBUG_BOT === 'true',
  enrichmentCacheFile:
    process.env.ENRICHMENT_CACHE_FILE ?? '.data/enrichment-cache.json',
  logCache: process.env.LOG_CACHE === 'true',
  migrationDatabaseUrl: process.env.MIGRATION_DATABASE_URL ?? '',
  migrationDbPassword: process.env.MIGRATION_DB_PASSWORD ?? '',
  migrationDbUser: process.env.MIGRATION_DB_USER ?? '',
  openAiApiKey: process.env.OPENAI_API_KEY ?? '',
  openAiModel: process.env.OPENAI_MODEL ?? 'gpt-5.4-mini',
  openAiServiceTier: getOpenAiServiceTier(),
  logUsage: process.env.LOG_USAGE === 'true',
  postgresAdminPassword: process.env.POSTGRES_ADMIN_PASSWORD ?? '',
  postgresAdminUser: process.env.POSTGRES_ADMIN_USER ?? '',
  postgresDb: process.env.POSTGRES_DB ?? '',
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

if (!env.databaseUrl) {
  throw new Error(
    'DATABASE_URL is missing. Put it into .env before starting the bot.',
  );
}

if (!env.migrationDatabaseUrl) {
  throw new Error(
    'MIGRATION_DATABASE_URL is missing. Put it into .env before running Prisma migrations.',
  );
}

if (!env.postgresDb) {
  throw new Error(
    'POSTGRES_DB is missing. Put it into .env before starting PostgreSQL.',
  );
}

if (!env.postgresAdminUser || !env.postgresAdminPassword) {
  throw new Error(
    'POSTGRES_ADMIN_USER or POSTGRES_ADMIN_PASSWORD is missing. Put both into .env before starting PostgreSQL.',
  );
}

if (!env.appDbUser || !env.appDbPassword) {
  throw new Error(
    'APP_DB_USER or APP_DB_PASSWORD is missing. Put both into .env before starting PostgreSQL.',
  );
}

if (!env.migrationDbUser || !env.migrationDbPassword) {
  throw new Error(
    'MIGRATION_DB_USER or MIGRATION_DB_PASSWORD is missing. Put both into .env before starting PostgreSQL.',
  );
}
