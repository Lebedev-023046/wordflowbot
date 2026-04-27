import { Markup } from 'telegraf';

export function renderSessionKeyboard({ isActive }: { isActive: boolean }) {
  return Markup.keyboard([[isActive ? 'Stop session' : 'Start session']]).resize();
}
