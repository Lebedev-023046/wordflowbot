import assert from 'node:assert/strict';
import test from 'node:test';
import { registerExportCsvCommand } from '../../../src/adapters/telegram/commands/exportCsv.command';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import type {
  ExportSessionCsvFilter,
  ExportSessionCsvResult,
  ExportSessionCsvUseCase,
} from '../../../src/application/use-cases/ExportSessionCsvUseCase';
import { buttons } from '../../../src/shared/i18n/buttons';
import { messages } from '../../../src/shared/i18n/messages';

type ExportHandler = (ctx: FakeContext) => Promise<unknown>;

class FakeBot {
  readonly actions = new Map<string, ExportHandler>();
  readonly hearsHandlers = new Map<string, ExportHandler>();

  action(trigger: string, handler: ExportHandler) {
    this.actions.set(trigger, handler);
    return this;
  }

  hears(trigger: string, handler: ExportHandler) {
    this.hearsHandlers.set(trigger, handler);
    return this;
  }
}

class FakeContext {
  readonly answeredCallbackQueries: undefined[] = [];
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
  from = { id: 1 };

  async answerCbQuery() {
    this.answeredCallbackQueries.push(undefined);
  }

  async editMessageText(text: string, extra?: object) {
    this.editMessageTextCalls.push({ extra, text });
  }

  async reply(text: string, extra?: object) {
    this.replyCalls.push({ extra, text });
  }

  async replyWithDocument(document: { filename: string; source: Buffer }) {
    this.documentCalls.push({ document });
  }
}

function createExportUseCaseStub(
  execute: (
    userId: number,
    filter?: ExportSessionCsvFilter,
  ) => Promise<ExportSessionCsvResult>,
): ExportSessionCsvUseCase {
  return {
    execute,
  } as ExportSessionCsvUseCase;
}

function normalizeMarkup(value: object | undefined) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

test('export command shows one-button-per-row filter chooser for ready exports', async () => {
  const bot = new FakeBot();

  registerExportCsvCommand(
    bot as unknown as never,
    new InMemoryEntryRepository(),
    new InMemorySessionRepository(),
    createExportUseCaseStub(async () => ({
      content: '"word";"translation"',
      fileName: 'session-1.csv',
      kind: 'ready',
    })),
  );

  const ctx = new FakeContext();
  const handler = bot.hearsHandlers.get(buttons.exportCsv);

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.replyCalls.length, 1);
  assert.equal(ctx.replyCalls[0]?.text, messages.session.exportChoose);
  assert.deepEqual(normalizeMarkup(ctx.replyCalls[0]?.extra), {
    reply_markup: {
      inline_keyboard: [
        [
          {
            callback_data: 'export_csv:all',
            hide: false,
            text: buttons.exportCsvAllWords,
          },
        ],
        [
          {
            callback_data: 'export_csv:A',
            hide: false,
            text: buttons.exportCsvMostUseful,
          },
        ],
        [
          {
            callback_data: 'export_csv:B',
            hide: false,
            text: buttons.exportCsvGoodToKnow,
          },
        ],
        [
          {
            callback_data: 'export_csv:C',
            hide: false,
            text: buttons.exportCsvRarelyUsed,
          },
        ],
      ],
    },
  });
  assert.equal(ctx.documentCalls.length, 0);
});

test('export command uses empty-result session metadata to render the active keyboard', async () => {
  const bot = new FakeBot();

  registerExportCsvCommand(
    bot as unknown as never,
    new InMemoryEntryRepository(),
    new InMemorySessionRepository(),
    createExportUseCaseStub(async () => ({
      hasEntries: true,
      hasFailedEntries: true,
      kind: 'empty',
    })),
  );

  const ctx = new FakeContext();
  const handler = bot.hearsHandlers.get(buttons.exportCsv);

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.replyCalls.length, 1);
  assert.equal(ctx.replyCalls[0]?.text, messages.session.emptyExport);
  assert.deepEqual(normalizeMarkup(ctx.replyCalls[0]?.extra), {
    reply_markup: {
      keyboard: [
        [buttons.showWords],
        [buttons.exportCsv],
        [buttons.myLibrary],
        [buttons.stopSession, buttons.retryFailed],
        [buttons.clearSession],
      ],
      resize_keyboard: true,
    },
  });
});

test('filtered export callback shows a filter-specific empty state and clears inline buttons', async () => {
  const bot = new FakeBot();

  registerExportCsvCommand(
    bot as unknown as never,
    new InMemoryEntryRepository(),
    new InMemorySessionRepository(),
    createExportUseCaseStub(async (_userId, filter) => {
      assert.equal(filter, 'A');

      return {
        hasEntries: true,
        hasFailedEntries: false,
        kind: 'empty',
      };
    }),
  );

  const ctx = new FakeContext();
  const handler = bot.actions.get('export_csv:A');

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.answeredCallbackQueries.length, 1);
  assert.deepEqual(ctx.editMessageTextCalls, [
    {
      extra: { reply_markup: { inline_keyboard: [] } },
      text: messages.session.emptyExportForFilter(buttons.exportCsvMostUseful),
    },
  ]);
});

test('export callback sends UTF-8 CSV with BOM for the selected filter', async () => {
  const bot = new FakeBot();

  registerExportCsvCommand(
    bot as unknown as never,
    new InMemoryEntryRepository(),
    new InMemorySessionRepository(),
    createExportUseCaseStub(async (_userId, filter) => {
      assert.equal(filter, 'B');

      return {
        content: '"rumor";"translation for rumor"',
        fileName: 'Product meeting.csv',
        kind: 'ready',
      };
    }),
  );

  const ctx = new FakeContext();
  const handler = bot.actions.get('export_csv:B');

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.answeredCallbackQueries.length, 1);
  assert.equal(ctx.documentCalls.length, 1);
  assert.equal(ctx.documentCalls[0]?.document.filename, 'Product meeting.csv');
  assert.equal(
    ctx.documentCalls[0]?.document.source.toString('hex'),
    Buffer.from('\uFEFF"rumor";"translation for rumor"', 'utf8').toString(
      'hex',
    ),
  );
});

test('export callback shows no-active state and clears inline buttons when the session is gone', async () => {
  const bot = new FakeBot();

  registerExportCsvCommand(
    bot as unknown as never,
    new InMemoryEntryRepository(),
    new InMemorySessionRepository(),
    createExportUseCaseStub(async () => ({ kind: 'noActive' })),
  );

  const ctx = new FakeContext();
  const handler = bot.actions.get('export_csv:all');

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.answeredCallbackQueries.length, 1);
  assert.deepEqual(ctx.editMessageTextCalls, [
    {
      extra: { reply_markup: { inline_keyboard: [] } },
      text: messages.session.noActive,
    },
  ]);
});
