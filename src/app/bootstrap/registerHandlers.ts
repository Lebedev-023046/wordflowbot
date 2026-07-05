import type { Telegraf } from 'telegraf';
import { registerClearSessionCommand } from '../../adapters/telegram/commands/clearSession.command';
import { registerExportCsvCommand } from '../../adapters/telegram/commands/exportCsv.command';
import { registerHelpCommand } from '../../adapters/telegram/commands/help.command';
import { registerLibraryCommand } from '../../adapters/telegram/commands/library.command';
import { registerOnboardingCommand } from '../../adapters/telegram/commands/onboarding.command';
import { registerRetryFailedCommand } from '../../adapters/telegram/commands/retryFailed.command';
import { registerSettingsCommand } from '../../adapters/telegram/commands/settings.command';
import { registerCurrentSessionWordsCommand } from '../../adapters/telegram/commands/currentSessionWords.command';
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
    container.repositories.userSettings,
  );
  registerOnboardingCommand(
    bot,
    container.repositories.entries,
    container.repositories.sessions,
    container.repositories.userSettings,
    container.repositories.languageLevels,
  );
  registerSettingsCommand(
    bot,
    container.repositories.userSettings,
    container.repositories.languageLevels,
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
    container.useCases.getLibraryHistory,
    container.useCases.getFinishedSessionWords,
    container.useCases.exportFinishedSessionCsv,
    container.state.sessionRename,
  );
  registerRetryFailedCommand(
    bot,
    container.repositories.entries,
    container.repositories.sessions,
    container.useCases.retryFailedEntries,
  );
  registerCurrentSessionWordsCommand(bot, container.useCases.getSessionWords);
  registerStatusCommand(bot, container.useCases.getSessionStatus);
  registerHelpCommand(bot);
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
    container.useCases.getFinishedSessionWords,
    container.useCases.renameSession,
    container.state.sessionRename,
    container.repositories.languageLevels,
  );
}
