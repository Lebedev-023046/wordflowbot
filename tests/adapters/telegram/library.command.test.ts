import assert from 'node:assert/strict';
import test from 'node:test';
import { registerLibraryCommand } from '../../../src/adapters/telegram/commands/library.command';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { PendingSessionRenameStore } from '../../../src/adapters/telegram/lib/pendingSessionRenameState';
import { EntryFactory } from '../../../src/application/services/EntryFactory';
import { GetLibraryStatisticsUseCase } from '../../../src/application/library/queries/GetLibraryStatisticsUseCase';
import { GetLibraryWordsUseCase } from '../../../src/application/library/queries/GetLibraryWordsUseCase';
import { GetLibraryHistoryUseCase } from '../../../src/application/library/queries/GetLibraryHistoryUseCase';
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
  callbackQuery = { data: '' };
  from = { id: 1 };
  answeredCallbackQueries: undefined[] = [];

  async reply(text: string, extra?: object) {
    this.replyCalls.push({ extra, text });
    return { message_id: this.replyCalls.length };
  }

  async answerCbQuery() {
    this.answeredCallbackQueries.push(undefined);
  }
}

function normalizeMarkup(value: object | undefined) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

function getActionHandler(bot: FakeBot, trigger: string): Handler | undefined {
  for (const [registeredTrigger, handler] of bot.actions.entries()) {
    if (
      typeof registeredTrigger === 'string'
        ? registeredTrigger === trigger
        : registeredTrigger.test(trigger)
    ) {
      return handler;
    }
  }

  return undefined;
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
    new GetLibraryHistoryUseCase(sessions, entries),
    new PendingSessionRenameStore(),
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
    new GetLibraryHistoryUseCase(sessions, entries),
    new PendingSessionRenameStore(),
  );

  const handler = bot.hearsHandlers.get(buttons.statistics);
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.equal(
    ctx.replyCalls[0]?.text,
    [
      'Library stats',
      '',
      'Saved words: 1',
      'Finished sessions: 1',
      'Active session: yes',
      '',
      'Usage split',
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
    new GetLibraryHistoryUseCase(sessions, entries),
    new PendingSessionRenameStore(),
  );

  const handler = bot.hearsHandlers.get(buttons.myWords);
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.equal(
    ctx.replyCalls[0]?.text,
    [
      'Saved words',
      '',
      '🔥 Most useful:',
      '1. hassle - translation for hassle',
      '',
      '👌 Good to know:',
      '1. rumor - translation for rumor',
      '',
      '🪶 Rarely used:',
      'No words here yet.',
    ].join('\n'),
  );
});

test('history shows finished sessions with default title, end date, and completed words count', async () => {
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

  registerLibraryCommand(
    bot as unknown as never,
    entries,
    sessions,
    new GetLibraryStatisticsUseCase(sessions, entries),
    new GetLibraryWordsUseCase(sessions, entries),
    new GetLibraryHistoryUseCase(sessions, entries),
    new PendingSessionRenameStore(),
  );

  const handler = bot.hearsHandlers.get(buttons.history);
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.match(
    ctx.replyCalls[0]?.text ?? '',
    /^Session history\n\n1\. session-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}\nEnded: \d{4}-\d{2}-\d{2} \d{2}:\d{2}\nReady words: 1$/,
  );
});

test('history rename action prompts with the current session title', async () => {
  const bot = new FakeBot();
  const entries = new InMemoryEntryRepository();
  const sessions = new InMemorySessionRepository();
  const session = await sessions.startSession(1);
  await sessions.stopSession(1);
  const renameState = new PendingSessionRenameStore();

  registerLibraryCommand(
    bot as unknown as never,
    entries,
    sessions,
    new GetLibraryStatisticsUseCase(sessions, entries),
    new GetLibraryWordsUseCase(sessions, entries),
    new GetLibraryHistoryUseCase(sessions, entries),
    renameState,
  );

  const handler = getActionHandler(
    bot,
    `library_history_rename:${session.id}:0`,
  );
  const ctx = new FakeContext();
  ctx.callbackQuery = { data: `library_history_rename:${session.id}:0` };

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.answeredCallbackQueries.length, 1);
  assert.equal(
    ctx.replyCalls[0]?.text.startsWith('Reply with the session name.'),
    true,
  );
  assert.deepEqual(renameState.get(1), {
    promptMessageId: 1,
    sessionId: session.id,
    source: 'history',
  });
});
