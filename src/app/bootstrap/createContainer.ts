import { CachedEntryEnrichmentClient } from '../../adapters/ai/CachedEntryEnrichmentClient';
import { OpenAIEnrichmentClient } from '../../adapters/ai/OpenAIEnrichmentClient';
import { ENTRY_ENRICHMENT_PROMPT_VERSION } from '../../adapters/ai/system-prompt';
import { ImmediateEnrichmentJobQueue } from '../../adapters/queue/ImmediateEnrichmentJobQueue';
import { PrismaEntryRepository } from '../../adapters/storage/prisma/PrismaEntryRepository';
import { PrismaEnrichmentCacheRepository } from '../../adapters/storage/prisma/PrismaEnrichmentCacheRepository';
import { createPrismaClient } from '../../adapters/storage/prisma/createPrismaClient';
import { PrismaSessionRepository } from '../../adapters/storage/prisma/PrismaSessionRepository';
import { CsvExporter } from '../../application/services/CsvExporter';
import { EntryFactory } from '../../application/services/EntryFactory';
import { EntryParser } from '../../application/services/EntryParser';
import { ClearSessionUseCase } from '../../application/use-cases/ClearSessionUseCase';
import { ExportSessionCsvUseCase } from '../../application/use-cases/ExportSessionCsvUseCase';
import { GetLibraryStatisticsUseCase } from '../../application/use-cases/GetLibraryStatisticsUseCase';
import { GetLibraryWordsUseCase } from '../../application/use-cases/GetLibraryWordsUseCase';
import { GetSessionStatusUseCase } from '../../application/use-cases/GetSessionStatusUseCase';
import { GetSessionWordsUseCase } from '../../application/use-cases/GetSessionWordsUseCase';
import { IntakeEntriesUseCase } from '../../application/use-cases/IntakeEntriesUseCase';
import { ProcessEntriesUseCase } from '../../application/use-cases/ProcessEntriesUseCase';
import { RetryFailedEntriesUseCase } from '../../application/use-cases/RetryFailedEntriesUseCase';
import { StartSessionUseCase } from '../../application/use-cases/StartSessionUseCase';
import { StopSessionUseCase } from '../../application/use-cases/StopSessionUseCase';
import { createLogger } from '../../shared/logging/logger';
import { env } from '../config/env';

export function createContainer() {
  const prisma = createPrismaClient();
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
  const cacheRepositoryLogger = createLogger({
    scope: 'PrismaEnrichmentCacheRepository',
  });
  const processEntriesLogger = createLogger({
    scope: 'ProcessEntriesUseCase',
  });

  const sessionRepository = new PrismaSessionRepository(prisma);
  const entryRepository = new PrismaEntryRepository(prisma);
  const enrichmentCacheRepository = new PrismaEnrichmentCacheRepository(
    prisma,
    cacheRepositoryLogger,
  );

  const openAiEnrichmentClient = new OpenAIEnrichmentClient({
    apiKey: env.openAiApiKey,
    debugLogger: openAiDebugLogger,
    model: env.openAiModel,
    serviceTier: env.openAiServiceTier,
    usageLogger,
  });
  const entryEnrichmentClient = new CachedEntryEnrichmentClient({
    cacheRepository: enrichmentCacheRepository,
    delegate: openAiEnrichmentClient,
    logger: cacheLogger,
    model: env.openAiModel,
    promptVersion: ENTRY_ENRICHMENT_PROMPT_VERSION,
  });

  const entryParser = new EntryParser();
  const entryFactory = new EntryFactory();
  const csvExporter = new CsvExporter();

  const startSessionUseCase = new StartSessionUseCase(sessionRepository);
  const stopSessionUseCase = new StopSessionUseCase(sessionRepository);
  const clearSessionUseCase = new ClearSessionUseCase(
    sessionRepository,
    entryRepository,
  );
  const getSessionStatusUseCase = new GetSessionStatusUseCase(
    sessionRepository,
    entryRepository,
  );
  const getLibraryStatisticsUseCase = new GetLibraryStatisticsUseCase(
    sessionRepository,
    entryRepository,
  );
  const getLibraryWordsUseCase = new GetLibraryWordsUseCase(
    sessionRepository,
    entryRepository,
  );
  const getSessionWordsUseCase = new GetSessionWordsUseCase(
    sessionRepository,
    entryRepository,
  );
  const exportSessionCsvUseCase = new ExportSessionCsvUseCase(
    sessionRepository,
    entryRepository,
    csvExporter,
  );
  const intakeEntriesUseCase = new IntakeEntriesUseCase(
    entryRepository,
    entryParser,
    entryFactory,
  );
  const processEntriesUseCase = new ProcessEntriesUseCase(
    entryEnrichmentClient,
    entryRepository,
    processEntriesLogger,
    env.enrichmentConcurrency,
  );
  const enrichmentJobQueue = new ImmediateEnrichmentJobQueue(
    processEntriesUseCase,
  );
  const retryFailedEntriesUseCase = new RetryFailedEntriesUseCase(
    sessionRepository,
    entryRepository,
    enrichmentJobQueue,
  );

  return {
    prisma,
    repositories: {
      entries: entryRepository,
      sessions: sessionRepository,
    },
    useCases: {
      clearSession: clearSessionUseCase,
      exportSessionCsv: exportSessionCsvUseCase,
      getLibraryStatistics: getLibraryStatisticsUseCase,
      getLibraryWords: getLibraryWordsUseCase,
      getSessionStatus: getSessionStatusUseCase,
      getSessionWords: getSessionWordsUseCase,
      intakeEntries: intakeEntriesUseCase,
      processEntries: processEntriesUseCase,
      retryFailedEntries: retryFailedEntriesUseCase,
      startSession: startSessionUseCase,
      stopSession: stopSessionUseCase,
    },
    queues: {
      enrichment: enrichmentJobQueue,
    },
  };
}

export type AppContainer = ReturnType<typeof createContainer>;
