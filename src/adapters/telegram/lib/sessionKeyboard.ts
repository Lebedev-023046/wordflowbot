import { Markup } from 'telegraf';
import { buttons } from '../../../shared/i18n/buttons';

export function renderSessionKeyboard(isActive: boolean) {
  const rows = isActive
    ? [[buttons.stopSession], [buttons.exportCsv]]
    : [[buttons.startSession]];

  return Markup.keyboard(rows).resize();
}
