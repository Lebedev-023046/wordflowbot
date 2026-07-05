import assert from 'node:assert/strict';
import test from 'node:test';
import { registerSettingsCommand } from '../../../src/adapters/telegram/commands/settings.command';
import { InMemoryLanguageLevelRepository } from '../../../src/adapters/storage/in-memory/InMemoryLanguageLevelRepository';
import { InMemoryUserSettingsRepository } from '../../../src/adapters/storage/in-memory/InMemoryUserSettingsRepository';
import { messages } from '../../../src/shared/i18n/messages';

type Handler = (ctx: FakeContext) => Promise<unknown>;

class FakeBot {
  readonly actions = new Map<string | RegExp, Handler>();
  readonly commandHandlers = new Map<string, Handler>();

  action(trigger: string | RegExp, handler: Handler) {
    this.actions.set(trigger, handler);
    return this;
  }

  command(name: string, handler: Handler) {
    this.commandHandlers.set(name, handler);
    return this;
  }
}

class FakeContext {
  readonly editMessageTextCalls: Array<{ extra?: object; text: string }> = [];
  readonly replyCalls: Array<{ extra?: object; text: string }> = [];
  callbackQuery = { data: '' };
  from = { id: 1 };
  answeredCallbackQueries: undefined[] = [];

  async reply(text: string, extra?: object) {
    this.replyCalls.push({ extra, text });
  }

  async answerCbQuery() {
    this.answeredCallbackQueries.push(undefined);
  }

  async editMessageText(text: string, extra?: object) {
    this.editMessageTextCalls.push({ extra, text });
  }
}

function normalizeMarkup(value: object | undefined) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

function getActionHandler(bot: FakeBot, data: string): Handler | undefined {
  for (const [trigger, handler] of bot.actions.entries()) {
    if (typeof trigger === 'string' ? trigger === data : trigger.test(data)) {
      return handler;
    }
  }

  return undefined;
}

test('/settings shows the current study language and level', async () => {
  const bot = new FakeBot();
  const userSettings = new InMemoryUserSettingsRepository();
  const languageLevels = new InMemoryLanguageLevelRepository();
  await userSettings.save(1, {
    studyLanguage: 'en',
    translationLanguage: 'ru',
  });
  await languageLevels.setLevel(1, 'en', 'B2');

  registerSettingsCommand(
    bot as unknown as never,
    userSettings,
    languageLevels,
  );

  const ctx = new FakeContext();
  const handler = bot.commandHandlers.get('settings');

  assert.ok(handler);
  await handler(ctx);

  assert.equal(
    ctx.replyCalls[0]?.text,
    messages.settings.overview('🇬🇧 English', 'B2'),
  );
  assert.deepEqual(normalizeMarkup(ctx.replyCalls[0]?.extra), {
    reply_markup: {
      inline_keyboard: [
        [
          {
            callback_data: 'settings_change_lang',
            hide: false,
            text: 'Change language',
          },
        ],
        [
          {
            callback_data: 'settings_change_level',
            hide: false,
            text: 'Change level',
          },
        ],
      ],
    },
  });
});

test('settings_change_lang shows the language picker', async () => {
  const bot = new FakeBot();

  registerSettingsCommand(
    bot as unknown as never,
    new InMemoryUserSettingsRepository(),
    new InMemoryLanguageLevelRepository(),
  );

  const handler = getActionHandler(bot, 'settings_change_lang');
  const ctx = new FakeContext();
  ctx.callbackQuery = { data: 'settings_change_lang' };

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.answeredCallbackQueries.length, 1);
  assert.equal(
    ctx.editMessageTextCalls[0]?.text,
    messages.settings.chooseLanguage,
  );
  assert.deepEqual(normalizeMarkup(ctx.editMessageTextCalls[0]?.extra), {
    reply_markup: {
      inline_keyboard: [
        [
          {
            callback_data: 'settings_lang:en',
            hide: false,
            text: '🇬🇧 English',
          },
        ],
        [{ callback_data: 'settings_lang:pl', hide: false, text: '🇵🇱 Polish' }],
      ],
    },
  });
});

test('settings_change_level shows the level picker for the current study language', async () => {
  const bot = new FakeBot();
  const userSettings = new InMemoryUserSettingsRepository();
  await userSettings.save(1, {
    studyLanguage: 'pl',
    translationLanguage: 'ru',
  });

  registerSettingsCommand(
    bot as unknown as never,
    userSettings,
    new InMemoryLanguageLevelRepository(),
  );

  const handler = getActionHandler(bot, 'settings_change_level');
  const ctx = new FakeContext();
  ctx.callbackQuery = { data: 'settings_change_level' };

  assert.ok(handler);
  await handler(ctx);

  assert.equal(
    ctx.editMessageTextCalls[0]?.text,
    messages.settings.chooseLevel('🇵🇱 Polish'),
  );
  const keyboard = normalizeMarkup(ctx.editMessageTextCalls[0]?.extra);
  assert.equal(
    keyboard.reply_markup.inline_keyboard[0][0].callback_data,
    'settings_level:pl:A1',
  );
});

test('settings_lang callback shows the level picker for the selected language', async () => {
  const bot = new FakeBot();

  registerSettingsCommand(
    bot as unknown as never,
    new InMemoryUserSettingsRepository(),
    new InMemoryLanguageLevelRepository(),
  );

  const handler = getActionHandler(bot, 'settings_lang:pl');
  const ctx = new FakeContext();
  ctx.callbackQuery = { data: 'settings_lang:pl' };

  assert.ok(handler);
  await handler(ctx);

  assert.equal(
    ctx.editMessageTextCalls[0]?.text,
    messages.settings.chooseLevel('🇵🇱 Polish'),
  );
  const keyboard = normalizeMarkup(ctx.editMessageTextCalls[0]?.extra);
  assert.equal(
    keyboard.reply_markup.inline_keyboard[0][0].callback_data,
    'settings_level:pl:A1',
  );
});

test('settings_level callback switching language reports a language change', async () => {
  const bot = new FakeBot();
  const userSettings = new InMemoryUserSettingsRepository();
  const languageLevels = new InMemoryLanguageLevelRepository();
  await userSettings.save(1, {
    studyLanguage: 'en',
    translationLanguage: 'ru',
  });

  registerSettingsCommand(
    bot as unknown as never,
    userSettings,
    languageLevels,
  );

  const handler = getActionHandler(bot, 'settings_level:pl:A1');
  const ctx = new FakeContext();
  ctx.callbackQuery = { data: 'settings_level:pl:A1' };

  assert.ok(handler);
  await handler(ctx);

  assert.equal(
    ctx.editMessageTextCalls[0]?.text,
    messages.settings.languageChanged('🇵🇱 Polish', 'A1'),
  );
  assert.deepEqual(await userSettings.get(1), {
    studyLanguage: 'pl',
    translationLanguage: 'ru',
  });
  assert.equal(await languageLevels.getLevel(1, 'pl'), 'A1');
});

test('settings_level callback for the current language reports a level change', async () => {
  const bot = new FakeBot();
  const userSettings = new InMemoryUserSettingsRepository();
  const languageLevels = new InMemoryLanguageLevelRepository();
  await userSettings.save(1, {
    studyLanguage: 'en',
    translationLanguage: 'ru',
  });

  registerSettingsCommand(
    bot as unknown as never,
    userSettings,
    languageLevels,
  );

  const handler = getActionHandler(bot, 'settings_level:en:C1');
  const ctx = new FakeContext();
  ctx.callbackQuery = { data: 'settings_level:en:C1' };

  assert.ok(handler);
  await handler(ctx);

  assert.equal(
    ctx.editMessageTextCalls[0]?.text,
    messages.settings.levelChanged('🇬🇧 English', 'C1'),
  );
  assert.equal(await languageLevels.getLevel(1, 'en'), 'C1');
});
