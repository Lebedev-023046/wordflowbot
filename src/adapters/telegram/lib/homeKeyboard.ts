import { Markup } from 'telegraf';
import { buttons } from '../../../shared/i18n/buttons';

export type HomeKeyboardMode = 'active' | 'first_time' | 'returning';

export function renderHomeKeyboard(mode: HomeKeyboardMode) {
  if (mode === 'returning') {
    return Markup.keyboard([
      [buttons.startSession],
      [buttons.openLastSession],
      [buttons.myLibrary],
    ]).resize();
  }

  if (mode === 'active') {
    return Markup.keyboard([
      [buttons.showWords],
      [buttons.exportCsv],
      [buttons.stopSession],
      [buttons.myLibrary],
    ]).resize();
  }

  return Markup.keyboard([
    [buttons.startSession],
    [buttons.myLibrary],
  ]).resize();
}
