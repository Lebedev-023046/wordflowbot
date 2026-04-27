import type { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { handleTextEntries } from '../../../features/intake-entries/model/handleTextEntries';
import { buttons } from '../../../shared/i18n/buttons';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import { renderSessionKeyboard } from '../lib/sessionKeyboard';
import { getReplyText } from './textMessage.helpers';

export function registerTextMessageHandler(
  bot: Telegraf,
  sessions: SessionRepository,
  entries: EntryRepository,
) {
  bot.on(message('text'), (ctx) => {
    const text = ctx.message.text;

    if (text === buttons.startSession || text === buttons.stopSession) {
      return;
    }

    const userId = getUserId(ctx);
    const session = sessions.getActiveSession(userId);

    if (!session) {
      return ctx.reply(messages.session.idle, renderSessionKeyboard(false));
    }

    const result = handleTextEntries({
      entryRepository: entries,
      sessionId: session.id,
      text,
    });

    return ctx.reply(getReplyText(result));
  });
}
