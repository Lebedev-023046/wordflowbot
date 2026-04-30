import type { Telegraf } from 'telegraf';
import { registerClearSessionCommand } from '../../adapters/telegram/commands/clearSession.command';
import { registerExportCsvCommand } from '../../adapters/telegram/commands/exportCsv.command';
import { registerLibraryCommand } from '../../adapters/telegram/commands/library.command';
import { registerRetryFailedCommand } from '../../adapters/telegram/commands/retryFailed.command';
import { registerSessionWordsCommand } from '../../adapters/telegram/commands/sessionWords.command';
import { registerStartCommand } from '../../adapters/telegram/commands/start.command';
import { registerStatusCommand } from '../../adapters/telegram/commands/status.command';
import { registerStopCommand } from '../../adapters/telegram/commands/stop.command';
import { registerTextMessageHandler } from '../../adapters/telegram/handlers/textMessage.handler';
import type { AppContainer } from './createContainer';

export function registerHandlers(bot: Telegraf, container: AppContainer) {
  registerClearSessionCommand(
    bot,
    container.repositories.entries,
    container.repositories.sessions,
    container.useCases.clearSession,
  );
  registerStartCommand(
    bot,
    container.repositories.entries,
    container.repositories.sessions,
    container.useCases.startSession,
  );
  registerExportCsvCommand(
    bot,
    container.repositories.entries,
    container.repositories.sessions,
    container.useCases.exportSessionCsv,
  );
  registerLibraryCommand(
    bot,
    container.repositories.entries,
    container.repositories.sessions,
    container.useCases.getLibraryStatistics,
    container.useCases.getLibraryWords,
    container.useCases.getSessionHistory,
    container.state.sessionRename,
  );
  registerRetryFailedCommand(
    bot,
    container.repositories.entries,
    container.repositories.sessions,
    container.useCases.retryFailedEntries,
  );
  registerSessionWordsCommand(bot, container.useCases.getSessionWords);
  registerStatusCommand(bot, container.useCases.getSessionStatus);
  registerStopCommand(
    bot,
    container.repositories.entries,
    container.repositories.sessions,
    container.useCases.stopSession,
    container.state.sessionRename,
  );
  registerTextMessageHandler(
    bot,
    container.repositories.entries,
    container.repositories.sessions,
    container.useCases.intakeEntries,
    container.queues.enrichment,
    container.useCases.renameSession,
    container.state.sessionRename,
  );
}
