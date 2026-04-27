import type { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { parseEntries } from '../../../features/intake-entries/model/parseEntries';
import { saveEntries } from '../../../features/intake-entries/model/saveEntries';
import { processEntry } from '../../../processes/entry-enrichment/model/processEntry';
import { getUserId } from '../lib/getUserId';
import { renderSessionKeyboard } from '../lib/sessionKeyboard';

export function registerTextMessageHandler(
  bot: Telegraf,
  sessions: SessionRepository,
  entries: EntryRepository,
) {
  bot.on(message('text'), (ctx) => {
    const text = ctx.message.text;

    if (text === 'Start session' || text === 'Stop session') {
      return;
    }

    const userId = getUserId(ctx);
    const session = sessions.getActiveSession(userId);

    if (!session) {
      return ctx.reply('Press Start session first.', renderSessionKeyboard({ isActive: false }));
    }

    const parsedEntries = parseEntries(text);

    if (parsedEntries.length === 0) {
      return ctx.reply('Send at least one word or phrase.');
    }

    const savedEntries = saveEntries({
      entryRepository: entries,
      sessionId: session.id,
      texts: parsedEntries,
    });

    if (savedEntries.length === 0) {
      return ctx.reply('All entries already exist in this session.');
    }

    void Promise.allSettled(savedEntries.map((entry) => processEntry(entry, entries)));

    return ctx.reply(`Saved: ${savedEntries.length} item(s).`);
  });
}
