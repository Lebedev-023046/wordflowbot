import { Markup } from 'telegraf';
import { buttons } from '../../../shared/i18n/buttons';

export function renderSessionKeyboard(
  isActive: boolean,
  hasEntries = false,
  hasFailedEntries = false,
) {
  const rows = isActive
    ? [
        [buttons.showWords],
        [buttons.exportCsv],
        [
          ...(hasEntries ? [buttons.clearSession] : []),
          buttons.stopSession,
          ...(hasFailedEntries ? [buttons.retryFailed] : []),
        ],
      ]
    : [[buttons.startSession]];

  return Markup.keyboard(rows).resize();
}
