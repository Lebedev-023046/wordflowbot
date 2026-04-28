import { Markup } from 'telegraf';
import { buttons } from '../../../shared/i18n/buttons';

export function renderSessionKeyboard(isActive: boolean) {
  const rows = isActive
    ? [[buttons.showWords], [buttons.retryFailed], [buttons.exportCsv], [buttons.stopSession]]
    : [[buttons.startSession]];

  return Markup.keyboard(rows).resize();
}
