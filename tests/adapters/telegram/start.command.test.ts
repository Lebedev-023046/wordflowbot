import assert from 'node:assert/strict';
import test from 'node:test';
import { registerStartCommand } from '../../../src/adapters/telegram/commands/start.command';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { InMemoryUserSettingsRepository } from '../../../src/adapters/storage/in-memory/InMemoryUserSettingsRepository';
import { EntryFactory } from '../../../src/application/services/EntryFactory';
import { StartSessionUseCase } from '../../../src/application/session/commands/StartSessionUseCase';
import { failEntry } from '../../../src/entities/entry/model/entryState';
import { buttons } from '../../../src/shared/i18n/buttons';
import { messages } from '../../../src/shared/i18n/messages';

type Handler = (ctx: FakeContext) => Promise<unknown>;

class FakeBot {
  readonly hearsHandlers = new Map<string, Handler>();
  startHandler: Handler | null = null;

  hears(trigger: string, handler: Handler) {
    this.hearsHandlers.set(trigger, handler);
    return this;
  }

  start(handler: Handler) {
    this.startHandler = handler;
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

test('start shows the language picker for a brand-new user with no settings', async () => {
  const bot = new FakeBot();
  const entries = new InMemoryEntryRepository();
  const sessions = new InMemorySessionRepository();
  const userSettings = new InMemoryUserSettingsRepository();

  registerStartCommand(
    bot as unknown as never,
    entries,
    sessions,
    new StartSessionUseCase(sessions, userSettings),
    userSettings,
  );

  const ctx = new FakeContext();

  assert.ok(bot.startHandler);
  await bot.startHandler(ctx);

  assert.equal(ctx.replyCalls[0]?.text, messages.onboarding.chooseLanguage);
  assert.deepEqual(normalizeMarkup(ctx.replyCalls[0]?.extra), {
    reply_markup: {
      inline_keyboard: [
        [
          {
            callback_data: 'onboarding_lang:en',
            hide: false,
            text: '🇬🇧 English',
          },
        ],
        [
          {
            callback_data: 'onboarding_lang:pl',
            hide: false,
            text: '🇵🇱 Polish',
          },
        ],
      ],
    },
  });
});

test('start skips onboarding for a pre-existing user with session history but no stored settings', async () => {
  const bot = new FakeBot();
  const entries = new InMemoryEntryRepository();
  const sessions = new InMemorySessionRepository();
  const userSettings = new InMemoryUserSettingsRepository();
  await sessions.startSession(1);
  await sessions.stopSession(1);

  registerStartCommand(
    bot as unknown as never,
    entries,
    sessions,
    new StartSessionUseCase(sessions, userSettings),
    userSettings,
  );

  const ctx = new FakeContext();

  assert.ok(bot.startHandler);
  await bot.startHandler(ctx);

  assert.equal(ctx.replyCalls[0]?.text, messages.session.returningStart(0, 0));
});

test('start shows first-time onboarding for a user who finished settings but has no sessions', async () => {
  const bot = new FakeBot();
  const entries = new InMemoryEntryRepository();
  const sessions = new InMemorySessionRepository();
  const userSettings = new InMemoryUserSettingsRepository();
  await userSettings.save(1, {
    studyLanguage: 'en',
    translationLanguage: 'ru',
  });

  registerStartCommand(
    bot as unknown as never,
    entries,
    sessions,
    new StartSessionUseCase(sessions, userSettings),
    userSettings,
  );

  const ctx = new FakeContext();

  assert.ok(bot.startHandler);
  await bot.startHandler(ctx);

  assert.equal(ctx.replyCalls[0]?.text, messages.session.promptStart);
  assert.deepEqual(normalizeMarkup(ctx.replyCalls[0]?.extra), {
    reply_markup: {
      keyboard: [[buttons.startSession], [buttons.myLibrary]],
      resize_keyboard: true,
    },
  });
});

test('start shows the returning-user home screen when finished sessions exist', async () => {
  const bot = new FakeBot();
  const entries = new InMemoryEntryRepository();
  const sessions = new InMemorySessionRepository();
  const userSettings = new InMemoryUserSettingsRepository();
  await userSettings.save(1, {
    studyLanguage: 'en',
    translationLanguage: 'ru',
  });
  await sessions.startSession(1);
  await sessions.stopSession(1);

  registerStartCommand(
    bot as unknown as never,
    entries,
    sessions,
    new StartSessionUseCase(sessions, userSettings),
    userSettings,
  );

  const ctx = new FakeContext();

  assert.ok(bot.startHandler);
  await bot.startHandler(ctx);

  assert.equal(ctx.replyCalls[0]?.text, messages.session.returningStart(0, 0));
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

test('start keeps active-session context and keyboard for active users', async () => {
  const bot = new FakeBot();
  const entries = new InMemoryEntryRepository();
  const sessions = new InMemorySessionRepository();
  const userSettings = new InMemoryUserSettingsRepository();
  await userSettings.save(1, {
    studyLanguage: 'en',
    translationLanguage: 'ru',
  });
  const entryFactory = new EntryFactory();
  const session = await sessions.startSession(1);

  await entries.saveMany([
    entryFactory.createPending(session.id, 'hassle'),
    failEntry(entryFactory.createPending(session.id, 'rumor'), 'Rate limited'),
  ]);

  registerStartCommand(
    bot as unknown as never,
    entries,
    sessions,
    new StartSessionUseCase(sessions, userSettings),
    userSettings,
  );

  const ctx = new FakeContext();

  assert.ok(bot.startHandler);
  await bot.startHandler(ctx);

  assert.equal(ctx.replyCalls[0]?.text, messages.session.active);
  assert.deepEqual(normalizeMarkup(ctx.replyCalls[0]?.extra), {
    reply_markup: {
      keyboard: [
        [buttons.showWords],
        [buttons.exportCsv],
        [buttons.stopSession],
        [buttons.myLibrary],
      ],
      resize_keyboard: true,
    },
  });
});
