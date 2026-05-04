import { Markup } from 'telegraf';
import { buttons } from '../../../shared/i18n/buttons';

export function renderSessionKeyboard(
  isActive: boolean,
  _hasEntries = false,
  _hasFailedEntries = false,
) {
  const rows = isActive
    ? [
        [buttons.showWords],
        [buttons.exportCsv],
        [buttons.stopSession],
        [buttons.myLibrary],
      ]
    : [[buttons.startSession], [buttons.myLibrary]];

  return Markup.keyboard(rows).resize();
}
