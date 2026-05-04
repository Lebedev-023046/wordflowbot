import assert from 'node:assert/strict';
import test from 'node:test';
import { registerLibraryCommand } from '../../../src/adapters/telegram/commands/library.command';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { PendingSessionRenameStore } from '../../../src/adapters/telegram/lib/pendingSessionRenameState';
import { ExportFinishedSessionCsvUseCase } from '../../../src/application/export/commands/ExportFinishedSessionCsvUseCase';
import { EntryFactory } from '../../../src/application/services/EntryFactory';
import { CsvExporter } from '../../../src/application/services/CsvExporter';
import { GetFinishedSessionWordsUseCase } from '../../../src/application/library/queries/GetFinishedSessionWordsUseCase';
import { GetLibraryHistoryUseCase } from '../../../src/application/library/queries/GetLibraryHistoryUseCase';
import {
  completeEntry,
  failEntry,
} from '../../../src/entities/entry/model/entryState';
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
  readonly documentCalls: Array<{
    document: { filename: string; source: Buffer };
  }> = [];
  readonly editMessageTextCalls: Array<{
    extra?: object;
    text: string;
  }> = [];
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

  async editMessageText(text: string, extra?: object) {
    this.editMessageTextCalls.push({ extra, text });
  }

  async replyWithDocument(document: { filename: string; source: Buffer }) {
    this.documentCalls.push({ document });
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

function createFinishedExportUseCase(
  sessions: InMemorySessionRepository,
  entries: InMemoryEntryRepository,
) {
  return new ExportFinishedSessionCsvUseCase(
    sessions,
    entries,
    new CsvExporter(),
  );
}

test('past sessions opens the session archive directly', async () => {
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
    new GetLibraryHistoryUseCase(sessions, entries),
    new GetFinishedSessionWordsUseCase(sessions, entries),
    createFinishedExportUseCase(sessions, entries),
    new PendingSessionRenameStore(),
  );

  const handler = bot.hearsHandlers.get(buttons.myLibrary);
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.equal(
    ctx.replyCalls[0]?.text,
    'Past sessions\n\nTap a session to open it.',
  );
  const firstButton = normalizeMarkup(ctx.replyCalls[0]?.extra)?.reply_markup
    ?.inline_keyboard?.[0]?.[0];
  assert.equal(
    firstButton?.callback_data,
    `library_history_words:${finishedSession.id}:0`,
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
    new GetLibraryHistoryUseCase(sessions, entries),
    new GetFinishedSessionWordsUseCase(sessions, entries),
    createFinishedExportUseCase(sessions, entries),
    new PendingSessionRenameStore(),
  );

  const handler = bot.hearsHandlers.get(buttons.myLibrary);
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.equal(
    ctx.replyCalls[0]?.text,
    'Past sessions\n\nTap a session to open it.',
  );
  const historyButton = normalizeMarkup(ctx.replyCalls[0]?.extra)?.reply_markup
    ?.inline_keyboard?.[0]?.[0];
  assert.equal(
    historyButton?.callback_data,
    `library_history_words:${finishedSession.id}:0`,
  );
  assert.equal(typeof historyButton?.text, 'string');
  assert.equal((historyButton?.text as string).startsWith('1. '), true);
  assert.match(
    historyButton?.text ?? '',
    /^1\. \d{2} [A-Z][a-z]{2} \d{2}:\d{2}$/,
  );
});

test('finished session rename action prompts with the current session title', async () => {
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
    new GetLibraryHistoryUseCase(sessions, entries),
    new GetFinishedSessionWordsUseCase(sessions, entries),
    createFinishedExportUseCase(sessions, entries),
    renameState,
  );

  const handler = getActionHandler(bot, `fsr:${session.id}:0`);
  const ctx = new FakeContext();
  ctx.callbackQuery = { data: `fsr:${session.id}:0` };

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.answeredCallbackQueries.length, 1);
  assert.equal(
    ctx.replyCalls[0]?.text.startsWith('Send a new session name.'),
    true,
  );
  assert.deepEqual(renameState.get(1), {
    historyPage: 0,
    promptMessageId: 1,
    sessionId: session.id,
    source: 'history',
  });
});

test('history view words action opens a read-only finished session viewer', async () => {
  const bot = new FakeBot();
  const entries = new InMemoryEntryRepository();
  const sessions = new InMemorySessionRepository();
  const entryFactory = new EntryFactory();
  const session = await sessions.startSession(1);

  await entries.saveMany([
    completeEntry(entryFactory.createPending(session.id, 'hassle'), {
      examples: [],
      translation: 'translation for hassle',
      usage: 'A',
    }),
    entryFactory.createPending(session.id, 'pending item'),
    failEntry(entryFactory.createPending(session.id, 'rumor'), 'Rate limited'),
  ]);
  await sessions.stopSession(1);

  registerLibraryCommand(
    bot as unknown as never,
    entries,
    sessions,
    new GetLibraryHistoryUseCase(sessions, entries),
    new GetFinishedSessionWordsUseCase(sessions, entries),
    createFinishedExportUseCase(sessions, entries),
    new PendingSessionRenameStore(),
  );

  const handler = getActionHandler(
    bot,
    `library_history_words:${session.id}:0`,
  );
  const ctx = new FakeContext();
  ctx.callbackQuery = { data: `library_history_words:${session.id}:0` };

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.answeredCallbackQueries.length, 1);
  assert.match(
    ctx.replyCalls[0]?.text ?? '',
    /^\d{2} [A-Z][a-z]{2} \d{2}:\d{2}/,
  );
  assert.match(
    ctx.replyCalls[0]?.text ?? '',
    /\n\nAll\n1\. hassle - translation for hassle/,
  );
  assert.match(
    ctx.replyCalls[0]?.text ?? '',
    /\n\nProcessing:\n1\. pending item/,
  );
  assert.match(ctx.replyCalls[0]?.text ?? '', /\n\nFailed:\n1\. rumor$/);
  assert.deepEqual(normalizeMarkup(ctx.replyCalls[0]?.extra), {
    reply_markup: {
      inline_keyboard: [
        [
          {
            callback_data: `fse:${session.id}:0`,
            hide: false,
            text: '📤 Export',
          },
        ],
        [
          {
            callback_data: `fsr:${session.id}:0`,
            hide: false,
            text: '✏️ Rename',
          },
          {
            callback_data: 'fsb:0',
            hide: false,
            text: '⬅ Back',
          },
        ],
      ],
    },
  });
});

test('back returns returning users to the returning home screen', async () => {
  const bot = new FakeBot();
  const entries = new InMemoryEntryRepository();
  const sessions = new InMemorySessionRepository();
  await sessions.startSession(1);
  await sessions.stopSession(1);

  registerLibraryCommand(
    bot as unknown as never,
    entries,
    sessions,
    new GetLibraryHistoryUseCase(sessions, entries),
    new GetFinishedSessionWordsUseCase(sessions, entries),
    createFinishedExportUseCase(sessions, entries),
    new PendingSessionRenameStore(),
  );

  const handler = bot.hearsHandlers.get(buttons.back);
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.replyCalls[0]?.text, messages.session.returningStart);
  assert.deepEqual(normalizeMarkup(ctx.replyCalls[0]?.extra), {
    reply_markup: {
      keyboard: [
        [buttons.startSession],
        [buttons.openLastSession],
        [buttons.myLibrary],
      ],
      resize_keyboard: true,
    },
  });
});

test('open last session jumps straight to the latest finished session detail', async () => {
  const bot = new FakeBot();
  const entries = new InMemoryEntryRepository();
  const sessions = new InMemorySessionRepository();
  const entryFactory = new EntryFactory();

  const older = await sessions.startSession(1);
  await entries.save(
    completeEntry(entryFactory.createPending(older.id, 'older'), {
      examples: [],
      translation: 'translation for older',
      usage: 'A',
    }),
  );
  await sessions.stopSession(1);

  const latest = await sessions.startSession(1);
  await entries.save(
    completeEntry(entryFactory.createPending(latest.id, 'latest'), {
      examples: [],
      translation: 'translation for latest',
      usage: 'B',
    }),
  );
  await sessions.stopSession(1);

  registerLibraryCommand(
    bot as unknown as never,
    entries,
    sessions,
    new GetLibraryHistoryUseCase(sessions, entries),
    new GetFinishedSessionWordsUseCase(sessions, entries),
    createFinishedExportUseCase(sessions, entries),
    new PendingSessionRenameStore(),
  );

  const handler = bot.hearsHandlers.get(buttons.openLastSession);
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.match(
    ctx.replyCalls[0]?.text ?? '',
    /\n\nAll\n1\. latest - translation for latest$/,
  );
});

test('finished session export sends UTF-8 CSV with BOM', async () => {
  const bot = new FakeBot();
  const entries = new InMemoryEntryRepository();
  const sessions = new InMemorySessionRepository();
  const entryFactory = new EntryFactory();
  const session = await sessions.startSession(1);

  await entries.save(
    completeEntry(entryFactory.createPending(session.id, 'rumor'), {
      examples: [
        {
          text: 'Example with rumor.',
          translation: 'Пример с rumor.',
        },
      ],
      translation: 'translation for rumor',
      usage: 'B',
    }),
  );
  await sessions.stopSession(1);

  registerLibraryCommand(
    bot as unknown as never,
    entries,
    sessions,
    new GetLibraryHistoryUseCase(sessions, entries),
    new GetFinishedSessionWordsUseCase(sessions, entries),
    createFinishedExportUseCase(sessions, entries),
    new PendingSessionRenameStore(),
  );

  const openChooserHandler = getActionHandler(bot, `fse:${session.id}:0`);
  const chooserCtx = new FakeContext();
  chooserCtx.callbackQuery = { data: `fse:${session.id}:0` };

  assert.ok(openChooserHandler);
  await openChooserHandler(chooserCtx);

  assert.equal(chooserCtx.answeredCallbackQueries.length, 1);
  assert.equal(chooserCtx.replyCalls[0]?.text, messages.session.exportChoose);
  assert.deepEqual(normalizeMarkup(chooserCtx.replyCalls[0]?.extra), {
    reply_markup: {
      inline_keyboard: [
        [
          {
            callback_data: `fsex:${session.id}:0:A`,
            hide: false,
            text: buttons.exportCsvMostUseful,
          },
          {
            callback_data: `fsex:${session.id}:0:B`,
            hide: false,
            text: buttons.exportCsvGoodToKnow,
          },
        ],
        [
          {
            callback_data: `fsex:${session.id}:0:C`,
            hide: false,
            text: buttons.exportCsvRarelyUsed,
          },
          {
            callback_data: `fsex:${session.id}:0:all`,
            hide: false,
            text: buttons.exportCsvAllWords,
          },
        ],
      ],
    },
  });

  const exportHandler = getActionHandler(bot, `fsex:${session.id}:0:B`);
  const exportCtx = new FakeContext();
  exportCtx.callbackQuery = { data: `fsex:${session.id}:0:B` };

  assert.ok(exportHandler);
  await exportHandler(exportCtx);

  assert.equal(exportCtx.answeredCallbackQueries.length, 1);
  assert.equal(exportCtx.documentCalls.length, 1);
  assert.match(
    exportCtx.documentCalls[0]?.document.filename ?? '',
    /^\d{2} [A-Z][a-z]{2} \d{2}-\d{2}\.csv$/,
  );
  assert.equal(
    exportCtx.documentCalls[0]?.document.source.toString('hex'),
    Buffer.from(
      '\uFEFF"rumor";"translation for rumor";"Example with rumor.";"Пример с rumor."',
      'utf8',
    ).toString('hex'),
  );
});
