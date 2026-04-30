import assert from 'node:assert/strict';
import test from 'node:test';
import { failEntry } from '../../../src/entities/entry/model/entryState';
import { registerStopCommand } from '../../../src/adapters/telegram/commands/stop.command';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { EntryFactory } from '../../../src/application/services/EntryFactory';
import { StopSessionUseCase } from '../../../src/application/use-cases/StopSessionUseCase';
import { buttons } from '../../../src/shared/i18n/buttons';
import { messages } from '../../../src/shared/i18n/messages';

type Handler = (ctx: FakeContext) => Promise<unknown>;

class FakeBot {
  readonly actions = new Map<string, Handler>();
  readonly hearsHandlers = new Map<string, Handler>();

  action(trigger: string, handler: Handler) {
    this.actions.set(trigger, handler);
    return this;
  }

  hears(trigger: string, handler: Handler) {
    this.hearsHandlers.set(trigger, handler);
    return this;
  }
}

class FakeContext {
  readonly answeredCallbackQueries: undefined[] = [];
  readonly deletedMessages: number[] = [];
  readonly editMessageTextCalls: string[] = [];
  readonly replyCalls: Array<{
    extra?: object;
    text: string;
  }> = [];
  from = { id: 1 };

  async answerCbQuery() {
    this.answeredCallbackQueries.push(undefined);
  }

  async deleteMessage() {
    this.deletedMessages.push(1);
  }

  async editMessageText(text: string) {
    this.editMessageTextCalls.push(text);
  }

  async reply(text: string, extra?: object) {
    this.replyCalls.push({ extra, text });
  }
}

function normalizeMarkup(value: object | undefined) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

test('finish session asks for confirmation with renamed actions', async () => {
  const sessions = new InMemorySessionRepository();
  await sessions.startSession(1);

  const bot = new FakeBot();
  registerStopCommand(
    bot as unknown as never,
    new InMemoryEntryRepository(),
    sessions,
    new StopSessionUseCase(sessions),
  );

  const handler = bot.hearsHandlers.get(buttons.stopSession);
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.deepEqual(normalizeMarkup(ctx.replyCalls[0]?.extra), {
    reply_markup: {
      inline_keyboard: [
        [
          {
            callback_data: 'stop_session:confirm',
            hide: false,
            text: buttons.confirmStopSession,
          },
          {
            callback_data: 'stop_session:cancel',
            hide: false,
            text: buttons.cancelStopSession,
          },
        ],
      ],
    },
  });
  assert.equal(ctx.replyCalls[0]?.text, messages.session.stopConfirm);
});

test('finish session confirmation closes the session and switches to the idle keyboard', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const entryFactory = new EntryFactory();
  const session = await sessions.startSession(1);

  await entries.save(entryFactory.createPending(session.id, 'hassle'));

  const bot = new FakeBot();
  registerStopCommand(
    bot as unknown as never,
    entries,
    sessions,
    new StopSessionUseCase(sessions),
  );

  const handler = bot.actions.get('stop_session:confirm');
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.answeredCallbackQueries.length, 1);
  assert.equal(ctx.deletedMessages.length, 1);
  assert.deepEqual(ctx.editMessageTextCalls, []);
  assert.equal(await sessions.hasActiveSession(1), false);
  assert.equal(ctx.replyCalls[0]?.text, messages.session.stopped);
  assert.deepEqual(normalizeMarkup(ctx.replyCalls[0]?.extra), {
    reply_markup: {
      keyboard: [[buttons.startSession], [buttons.myLibrary]],
      resize_keyboard: true,
    },
  });
});

test('finish session cancellation keeps the current active-session keyboard state', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const entryFactory = new EntryFactory();
  const session = await sessions.startSession(1);
  const pendingEntry = entryFactory.createPending(session.id, 'hassle');

  await entries.saveMany([
    pendingEntry,
    failEntry(entryFactory.createPending(session.id, 'rumor'), 'Rate limited'),
  ]);

  const bot = new FakeBot();
  registerStopCommand(
    bot as unknown as never,
    entries,
    sessions,
    new StopSessionUseCase(sessions),
  );

  const handler = bot.actions.get('stop_session:cancel');
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.answeredCallbackQueries.length, 1);
  assert.equal(ctx.deletedMessages.length, 1);
  assert.deepEqual(ctx.editMessageTextCalls, []);
  assert.equal(await sessions.hasActiveSession(1), true);
  assert.equal(ctx.replyCalls[0]?.text, messages.session.stopCancelled);
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
