import assert from 'node:assert/strict';
import test from 'node:test';
import { registerLibraryCommand } from '../../../src/adapters/telegram/commands/library.command';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { EntryFactory } from '../../../src/application/services/EntryFactory';
import { GetLibraryStatisticsUseCase } from '../../../src/application/use-cases/GetLibraryStatisticsUseCase';
import { GetLibraryWordsUseCase } from '../../../src/application/use-cases/GetLibraryWordsUseCase';
import { completeEntry } from '../../../src/entities/entry/model/entryState';
import { buttons } from '../../../src/shared/i18n/buttons';
import { messages } from '../../../src/shared/i18n/messages';

type Handler = (ctx: FakeContext) => Promise<unknown>;

class FakeBot {
  readonly actions = new Map<string | RegExp, Handler>();
  readonly hearsHandlers = new Map<string, Handler>();

  action(trigger: string | RegExp, handler: Handler) {
    this.actions.set(trigger, handler);
    return this;
  }

  hears(trigger: string, handler: Handler) {
    this.hearsHandlers.set(trigger, handler);
    return this;
  }
}

class FakeContext {
  readonly replyCalls: Array<{
    extra?: object;
    text: string;
  }> = [];
  from = { id: 1 };

  async reply(text: string, extra?: object) {
    this.replyCalls.push({ extra, text });
  }
}

function normalizeMarkup(value: object | undefined) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

test('my library opens the compact library menu', async () => {
  const bot = new FakeBot();
  const entries = new InMemoryEntryRepository();
  const sessions = new InMemorySessionRepository();

  registerLibraryCommand(
    bot as unknown as never,
    entries,
    sessions,
    new GetLibraryStatisticsUseCase(sessions, entries),
    new GetLibraryWordsUseCase(sessions, entries),
  );

  const handler = bot.hearsHandlers.get(buttons.myLibrary);
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.replyCalls[0]?.text, messages.library.menu);
  assert.deepEqual(normalizeMarkup(ctx.replyCalls[0]?.extra), {
    reply_markup: {
      keyboard: [
        [buttons.statistics],
        [buttons.myWords],
        [buttons.history],
        [buttons.back],
      ],
      resize_keyboard: true,
    },
  });
});

test('statistics shows library-only counts plus active-session status', async () => {
  const bot = new FakeBot();
  const entries = new InMemoryEntryRepository();
  const sessions = new InMemorySessionRepository();
  const entryFactory = new EntryFactory();

  const finishedSession = await sessions.startSession(1);
  await entries.save(
    completeEntry(entryFactory.createPending(finishedSession.id, 'hassle'), {
      examples: [],
      translation: 'translation for hassle',
      usage: 'A',
    }),
  );
  await sessions.stopSession(1);
  await sessions.startSession(1);

  registerLibraryCommand(
    bot as unknown as never,
    entries,
    sessions,
    new GetLibraryStatisticsUseCase(sessions, entries),
    new GetLibraryWordsUseCase(sessions, entries),
  );

  const handler = bot.hearsHandlers.get(buttons.statistics);
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.equal(
    ctx.replyCalls[0]?.text,
    [
      'Your statistics',
      '',
      'Words in your library: 1',
      'Finished sessions: 1',
      'Active session: yes',
      '',
      'By usage',
      '🔥 Most useful: 1',
      '👌 Good to know: 0',
      '🪶 Rarely used: 0',
    ].join('\n'),
  );
});

test('my words shows completed words from finished sessions', async () => {
  const bot = new FakeBot();
  const entries = new InMemoryEntryRepository();
  const sessions = new InMemorySessionRepository();
  const entryFactory = new EntryFactory();

  const finishedSession = await sessions.startSession(1);
  await entries.saveMany([
    completeEntry(entryFactory.createPending(finishedSession.id, 'hassle'), {
      examples: [],
      translation: 'translation for hassle',
      usage: 'A',
    }),
    completeEntry(entryFactory.createPending(finishedSession.id, 'rumor'), {
      examples: [],
      translation: 'translation for rumor',
      usage: 'B',
    }),
  ]);
  await sessions.stopSession(1);

  registerLibraryCommand(
    bot as unknown as never,
    entries,
    sessions,
    new GetLibraryStatisticsUseCase(sessions, entries),
    new GetLibraryWordsUseCase(sessions, entries),
  );

  const handler = bot.hearsHandlers.get(buttons.myWords);
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.equal(
    ctx.replyCalls[0]?.text,
    [
      'My words',
      '',
      '🔥 Most useful:',
      '1. hassle - translation for hassle',
      '',
      '👌 Good to know:',
      '1. rumor - translation for rumor',
      '',
      '🪶 Rarely used:',
      'No words in this filter yet.',
    ].join('\n'),
  );
});
