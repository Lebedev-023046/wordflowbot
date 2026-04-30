import { Markup } from 'telegraf';
import { buttons } from '../../../shared/i18n/buttons';

export function renderLibraryKeyboard() {
  return Markup.keyboard([
    [buttons.statistics],
    [buttons.myWords],
    [buttons.history],
    [buttons.back],
  ]).resize();
}
