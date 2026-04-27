import { Markup } from 'telegraf';
import { buttons } from '../../../shared/i18n/buttons';

export function renderSessionKeyboard(isActive: boolean) {
  return Markup.keyboard([[isActive ? buttons.stopSession : buttons.startSession]]).resize();
}
