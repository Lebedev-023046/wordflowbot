import assert from 'node:assert/strict';
import test from 'node:test';
import { registerOnboardingCommand } from '../../../src/adapters/telegram/commands/onboarding.command';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemoryLanguageLevelRepository } from '../../../src/adapters/storage/in-memory/InMemoryLanguageLevelRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { InMemoryUserSettingsRepository } from '../../../src/adapters/storage/in-memory/InMemoryUserSettingsRepository';
import { messages } from '../../../src/shared/i18n/messages';

type Handler = (ctx: FakeContext) => Promise<unknown>;

class FakeBot {
  readonly actions = new Map<string | RegExp, Handler>();

  action(trigger: string | RegExp, handler: Handler) {
    this.actions.set(trigger, handler);
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

test('onboarding_lang callback shows the level picker for the chosen language', async () => {
  const bot = new FakeBot();

  registerOnboardingCommand(
    bot as unknown as never,
    new InMemoryEntryRepository(),
    new InMemorySessionRepository(),
    new InMemoryUserSettingsRepository(),
    new InMemoryLanguageLevelRepository(),
  );

  const handler = getActionHandler(bot, 'onboarding_lang:pl');
  const ctx = new FakeContext();
  ctx.callbackQuery = { data: 'onboarding_lang:pl' };

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.answeredCallbackQueries.length, 1);
  assert.equal(
    ctx.editMessageTextCalls[0]?.text,
    messages.onboarding.chooseLevel('🇵🇱 Polish'),
  );
  assert.deepEqual(normalizeMarkup(ctx.editMessageTextCalls[0]?.extra), {
    reply_markup: {
      inline_keyboard: [
        [
          { callback_data: 'onboarding_level:pl:A1', hide: false, text: 'A1' },
          { callback_data: 'onboarding_level:pl:A2', hide: false, text: 'A2' },
          { callback_data: 'onboarding_level:pl:B1', hide: false, text: 'B1' },
        ],
        [
          { callback_data: 'onboarding_level:pl:B2', hide: false, text: 'B2' },
          { callback_data: 'onboarding_level:pl:C1', hide: false, text: 'C1' },
          { callback_data: 'onboarding_level:pl:C2', hide: false, text: 'C2' },
        ],
      ],
    },
  });
});

test('onboarding_level callback saves the study language and level, then shows the home screen', async () => {
  const bot = new FakeBot();
  const userSettings = new InMemoryUserSettingsRepository();
  const languageLevels = new InMemoryLanguageLevelRepository();

  registerOnboardingCommand(
    bot as unknown as never,
    new InMemoryEntryRepository(),
    new InMemorySessionRepository(),
    userSettings,
    languageLevels,
  );

  const handler = getActionHandler(bot, 'onboarding_level:pl:B1');
  const ctx = new FakeContext();
  ctx.callbackQuery = { data: 'onboarding_level:pl:B1' };

  assert.ok(handler);
  await handler(ctx);

  assert.equal(ctx.answeredCallbackQueries.length, 1);
  assert.equal(
    ctx.editMessageTextCalls[0]?.text,
    messages.onboarding.completed('🇵🇱 Polish', 'B1'),
  );
  assert.equal(ctx.replyCalls[0]?.text, messages.session.promptStart);

  assert.deepEqual(await userSettings.get(1), {
    studyLanguage: 'pl',
    translationLanguage: 'ru',
  });
  assert.equal(await languageLevels.getLevel(1, 'pl'), 'B1');
});
