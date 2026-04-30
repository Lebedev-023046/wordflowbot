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
        [buttons.myLibrary],
        [
          buttons.stopSession,
          ...(hasFailedEntries ? [buttons.retryFailed] : []),
        ],
        ...(hasEntries ? [[buttons.clearSession]] : []),
      ]
    : [[buttons.startSession], [buttons.myLibrary]];

  return Markup.keyboard(rows).resize();
}
