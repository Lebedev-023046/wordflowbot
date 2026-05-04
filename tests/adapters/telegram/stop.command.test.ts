import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { registerStopCommand } from '../../../src/adapters/telegram/commands/stop.command';
import { PendingSessionRenameStore } from '../../../src/adapters/telegram/lib/pendingSessionRenameState';
import { EntryFactory } from '../../../src/application/services/EntryFactory';
import { StopSessionUseCase } from '../../../src/application/session/commands/StopSessionUseCase';
import { failEntry } from '../../../src/entities/entry/model/entryState';
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
  readonly answeredCallbackQueries: undefined[] = [];
  readonly deletedMessages: number[] = [];
  readonly editMessageTextCalls: string[] = [];
  readonly replyCalls: Array<{
    extra?: object;
    text: string;
  }> = [];
  callbackQuery = { data: '' };
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
    return { message_id: this.replyCalls.length };
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

test('finish session asks for confirmation with renamed actions', async () => {
  const sessions = new InMemorySessionRepository();
  await sessions.startSession(1);

  const bot = new FakeBot();
  registerStopCommand(
    bot as unknown as never,
    new InMemoryEntryRepository(),
    sessions,
    new StopSessionUseCase(sessions),
    new PendingSessionRenameStore(),
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
    new PendingSessionRenameStore(),
  );

  const handler = getActionHandler(bot, 'stop_session:confirm');
  const ctx = new FakeContext();

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.answeredCallbackQueries.length, 1);
  assert.equal(ctx.deletedMessages.length, 1);
  assert.deepEqual(ctx.editMessageTextCalls, []);
  assert.equal(await sessions.hasActiveSession(1), false);
  assert.equal(ctx.replyCalls[0]?.text, messages.session.stopped);
  assert.equal(ctx.replyCalls[1]?.text, messages.session.stopRenameOffer);
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
    new PendingSessionRenameStore(),
  );

  const handler = getActionHandler(bot, 'stop_session:cancel');
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

test('finish session rename action prompts with the current title in force reply', async () => {
  const sessions = new InMemorySessionRepository();
  const session = await sessions.startSession(1);
  await sessions.stopSession(1);
  const bot = new FakeBot();
  const renameState = new PendingSessionRenameStore();

  registerStopCommand(
    bot as unknown as never,
    new InMemoryEntryRepository(),
    sessions,
    new StopSessionUseCase(sessions),
    renameState,
  );

  const handler = getActionHandler(bot, `stop_session:rename:${session.id}`);
  const ctx = new FakeContext();
  ctx.callbackQuery = { data: `stop_session:rename:${session.id}` };

  assert.ok(handler);
  await handler(ctx);

  assert.equal(
    ctx.replyCalls[0]?.text.startsWith('Reply with the session name.'),
    true,
  );
  assert.equal(
    normalizeMarkup(ctx.replyCalls[0]?.extra)?.reply_markup?.force_reply,
    true,
  );
  assert.deepEqual(renameState.get(1), {
    promptMessageId: 1,
    sessionId: session.id,
    source: 'post_finish',
  });
});
