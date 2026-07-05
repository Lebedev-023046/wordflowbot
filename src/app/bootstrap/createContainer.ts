import { CachedEntryEnrichmentClient } from '../../adapters/ai/CachedEntryEnrichmentClient';
import { OpenAIEnrichmentClient } from '../../adapters/ai/OpenAIEnrichmentClient';
import { ENTRY_ENRICHMENT_PROMPT_VERSION } from '../../adapters/ai/system-prompt';
import { ImmediateEnrichmentJobQueue } from '../../adapters/queue/ImmediateEnrichmentJobQueue';
import { PrismaEntryRepository } from '../../adapters/storage/prisma/PrismaEntryRepository';
import { PrismaEnrichmentCacheRepository } from '../../adapters/storage/prisma/PrismaEnrichmentCacheRepository';
import { createPrismaClient } from '../../adapters/storage/prisma/createPrismaClient';
import { PrismaLanguageLevelRepository } from '../../adapters/storage/prisma/PrismaLanguageLevelRepository';
import { PrismaSessionRepository } from '../../adapters/storage/prisma/PrismaSessionRepository';
import { PrismaUserSettingsRepository } from '../../adapters/storage/prisma/PrismaUserSettingsRepository';
import { PendingSessionRenameStore } from '../../adapters/telegram/lib/pendingSessionRenameState';
import { AddEntriesFromTextUseCase } from '../../application/entries/commands/AddEntriesFromTextUseCase';
import { EnrichEntriesUseCase } from '../../application/entries/commands/EnrichEntriesUseCase';
import { RetryFailedEntriesUseCase } from '../../application/entries/commands/RetryFailedEntriesUseCase';
import { ExportFinishedSessionCsvUseCase } from '../../application/export/commands/ExportFinishedSessionCsvUseCase';
import { ExportSessionCsvUseCase } from '../../application/export/commands/ExportSessionCsvUseCase';
import { GetLibraryHistoryUseCase } from '../../application/library/queries/GetLibraryHistoryUseCase';
import { GetFinishedSessionWordsUseCase } from '../../application/library/queries/GetFinishedSessionWordsUseCase';
import { CsvExporter } from '../../application/services/CsvExporter';
import { EntryFactory } from '../../application/services/EntryFactory';
import { EntryParser } from '../../application/services/EntryParser';
import { ClearSessionUseCase } from '../../application/session/commands/ClearSessionUseCase';
import { RenameSessionUseCase } from '../../application/session/commands/RenameSessionUseCase';
import { StartSessionUseCase } from '../../application/session/commands/StartSessionUseCase';
import { StopSessionUseCase } from '../../application/session/commands/StopSessionUseCase';
import { GetSessionStatusUseCase } from '../../application/session/queries/GetSessionStatusUseCase';
import { GetCurrentSessionWordsUseCase } from '../../application/session/queries/GetCurrentSessionWordsUseCase';
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
    scope: 'EnrichEntriesUseCase',
  });

  const sessionRepository = new PrismaSessionRepository(prisma);
  const entryRepository = new PrismaEntryRepository(prisma);
  const languageLevelRepository = new PrismaLanguageLevelRepository(prisma);
  const userSettingsRepository = new PrismaUserSettingsRepository(prisma);
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

  const startSessionUseCase = new StartSessionUseCase(
    sessionRepository,
    userSettingsRepository,
  );
  const stopSessionUseCase = new StopSessionUseCase(sessionRepository);
  const clearSessionUseCase = new ClearSessionUseCase(
    sessionRepository,
    entryRepository,
  );
  const getSessionStatusUseCase = new GetSessionStatusUseCase(
    sessionRepository,
    entryRepository,
  );
  const getLibraryHistoryUseCase = new GetLibraryHistoryUseCase(
    sessionRepository,
    entryRepository,
  );
  const getFinishedSessionWordsUseCase = new GetFinishedSessionWordsUseCase(
    sessionRepository,
    entryRepository,
  );
  const getCurrentSessionWordsUseCase = new GetCurrentSessionWordsUseCase(
    sessionRepository,
    entryRepository,
  );
  const exportSessionCsvUseCase = new ExportSessionCsvUseCase(
    sessionRepository,
    entryRepository,
    csvExporter,
  );
  const exportFinishedSessionCsvUseCase = new ExportFinishedSessionCsvUseCase(
    sessionRepository,
    entryRepository,
    csvExporter,
  );
  const addEntriesFromTextUseCase = new AddEntriesFromTextUseCase(
    entryRepository,
    entryParser,
    entryFactory,
  );
  const enrichEntriesUseCase = new EnrichEntriesUseCase(
    entryEnrichmentClient,
    entryRepository,
    processEntriesLogger,
    env.enrichmentConcurrency,
  );
  const enrichmentJobQueue = new ImmediateEnrichmentJobQueue(
    enrichEntriesUseCase,
  );
  const retryFailedEntriesUseCase = new RetryFailedEntriesUseCase(
    sessionRepository,
    entryRepository,
    enrichmentJobQueue,
    languageLevelRepository,
  );
  const renameSessionUseCase = new RenameSessionUseCase(sessionRepository);
  const pendingSessionRenameState = new PendingSessionRenameStore();

  return {
    prisma,
    repositories: {
      entries: entryRepository,
      languageLevels: languageLevelRepository,
      sessions: sessionRepository,
      userSettings: userSettingsRepository,
    },
    useCases: {
      clearSession: clearSessionUseCase,
      exportFinishedSessionCsv: exportFinishedSessionCsvUseCase,
      exportSessionCsv: exportSessionCsvUseCase,
      getLibraryHistory: getLibraryHistoryUseCase,
      getFinishedSessionWords: getFinishedSessionWordsUseCase,
      getSessionStatus: getSessionStatusUseCase,
      getSessionWords: getCurrentSessionWordsUseCase,
      intakeEntries: addEntriesFromTextUseCase,
      processEntries: enrichEntriesUseCase,
      renameSession: renameSessionUseCase,
      retryFailedEntries: retryFailedEntriesUseCase,
      startSession: startSessionUseCase,
      stopSession: stopSessionUseCase,
    },
    queues: {
      enrichment: enrichmentJobQueue,
    },
    state: {
      sessionRename: pendingSessionRenameState,
    },
  };
}

export type AppContainer = ReturnType<typeof createContainer>;
