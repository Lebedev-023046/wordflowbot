import assert from 'node:assert/strict';
import test from 'node:test';
import { registerClearSessionCommand } from '../../../src/adapters/telegram/commands/clearSession.command';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { EntryFactory } from '../../../src/application/services/EntryFactory';
import { ClearSessionUseCase } from '../../../src/application/use-cases/ClearSessionUseCase';
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
  readonly editMessageTextCalls: string[] = [];
  readonly replyCalls: Array<{
    extra?: object;
    text: string;
  }> = [];
  from = { id: 1 };

  async answerCbQuery() {
    this.answeredCallbackQueries.push(undefined);
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

test('clear words asks for confirmation with renamed actions', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const entryFactory = new EntryFactory();
  const session = await sessions.startSession(1);

  await entries.save(entryFactory.createPending(session.id, 'hassle'));

  const bot = new FakeBot();
  registerClearSessionCommand(
    bot as unknown as never,
    entries,
    sessions,
    new ClearSessionUseCase(sessions, entries),
  );

  const handler = bot.hearsHandlers.get(buttons.clearSession);
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.replyCalls[0]?.text, messages.session.clearConfirm);
  assert.deepEqual(normalizeMarkup(ctx.replyCalls[0]?.extra), {
    reply_markup: {
      inline_keyboard: [
        [
          {
            callback_data: 'clear_session:confirm',
            hide: false,
            text: buttons.confirmClearSession,
          },
          {
            callback_data: 'clear_session:cancel',
            hide: false,
            text: buttons.cancelClearSession,
          },
        ],
      ],
    },
  });
});

test('clear words confirmation removes entries and keeps the session active', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const entryFactory = new EntryFactory();
  const session = await sessions.startSession(1);

  await entries.save(entryFactory.createPending(session.id, 'hassle'));

  const bot = new FakeBot();
  registerClearSessionCommand(
    bot as unknown as never,
    entries,
    sessions,
    new ClearSessionUseCase(sessions, entries),
  );

  const handler = bot.actions.get('clear_session:confirm');
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.answeredCallbackQueries.length, 1);
  assert.deepEqual(ctx.editMessageTextCalls, [messages.session.cleared(1)]);
  assert.equal(await sessions.hasActiveSession(1), true);
  assert.deepEqual(await entries.findBySessionId(session.id), []);
  assert.deepEqual(normalizeMarkup(ctx.replyCalls[0]?.extra), {
    reply_markup: {
      keyboard: [
        [buttons.showWords],
        [buttons.exportCsv],
        [buttons.stopSession],
      ],
      resize_keyboard: true,
    },
  });
});

test('clear words cancellation preserves the active session keyboard state', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const entryFactory = new EntryFactory();
  const session = await sessions.startSession(1);

  await entries.save(entryFactory.createPending(session.id, 'hassle'));

  const bot = new FakeBot();
  registerClearSessionCommand(
    bot as unknown as never,
    entries,
    sessions,
    new ClearSessionUseCase(sessions, entries),
  );

  const handler = bot.actions.get('clear_session:cancel');
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.answeredCallbackQueries.length, 1);
  assert.deepEqual(ctx.editMessageTextCalls, [messages.session.clearCancelled]);
  assert.equal(await sessions.hasActiveSession(1), true);
  assert.equal((await entries.findBySessionId(session.id)).length, 1);
  assert.deepEqual(normalizeMarkup(ctx.replyCalls[0]?.extra), {
    reply_markup: {
      keyboard: [
        [buttons.showWords],
        [buttons.exportCsv],
        [buttons.clearSession, buttons.stopSession],
      ],
      resize_keyboard: true,
    },
  });
});
