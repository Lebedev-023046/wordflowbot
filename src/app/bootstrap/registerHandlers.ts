import type { Telegraf } from 'telegraf';
import { registerClearSessionCommand } from '../../adapters/telegram/commands/clearSession.command';
import { registerExportCsvCommand } from '../../adapters/telegram/commands/exportCsv.command';
import { registerRetryFailedCommand } from '../../adapters/telegram/commands/retryFailed.command';
import { registerSessionWordsCommand } from '../../adapters/telegram/commands/sessionWords.command';
import { registerStartCommand } from '../../adapters/telegram/commands/start.command';
import { registerStatusCommand } from '../../adapters/telegram/commands/status.command';
import { registerStopCommand } from '../../adapters/telegram/commands/stop.command';
import { registerTextMessageHandler } from '../../adapters/telegram/handlers/textMessage.handler';
import type { AppContainer } from './createContainer';

export function registerHandlers(bot: Telegraf, container: AppContainer) {
  registerClearSessionCommand(bot, container.useCases.clearSession);
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
  registerRetryFailedCommand(
    bot,
    container.repositories.entries,
    container.repositories.sessions,
    container.useCases.retryFailedEntries,
  );
  registerSessionWordsCommand(bot, container.useCases.getSessionWords);
  registerStatusCommand(bot, container.useCases.getSessionStatus);
  registerStopCommand(bot, container.useCases.stopSession);
  registerTextMessageHandler(
    bot,
    container.repositories.entries,
    container.repositories.sessions,
    container.useCases.intakeEntries,
    container.queues.enrichment,
  );
}
