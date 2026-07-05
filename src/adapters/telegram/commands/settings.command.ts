import { Markup, type Context, type Telegraf } from 'telegraf';
import type { LanguageLevelRepository } from '../../../application/ports/LanguageLevelRepository';
import type { UserSettingsRepository } from '../../../application/ports/UserSettingsRepository';
import { messages } from '../../../shared/i18n/messages';
import { getUserId } from '../lib/getUserId';
import {
  buildLanguageInlineKeyboard,
  buildLevelInlineKeyboard,
  getLanguageLabel,
  PROFICIENCY_LEVELS_PATTERN,
  STUDY_LANGUAGE_CODES_PATTERN,
} from '../lib/languageSelection';

const SETTINGS_LANGUAGE_CALLBACK_PREFIX = 'settings_lang';
const SETTINGS_LEVEL_CALLBACK_PREFIX = 'settings_level';
const SETTINGS_CHANGE_LANGUAGE_CALLBACK = 'settings_change_lang';
const SETTINGS_CHANGE_LEVEL_CALLBACK = 'settings_change_level';

const DEFAULT_STUDY_LANGUAGE = 'en';
const DEFAULT_TRANSLATION_LANGUAGE = 'ru';

export function registerSettingsCommand(
  bot: Telegraf,
  userSettingsRepository: UserSettingsRepository,
  languageLevelRepository: LanguageLevelRepository,
) {
  const showSettingsOverview = async (ctx: Context) => {
    const userId = getUserId(ctx);
    const settings = await userSettingsRepository.get(userId);
    const studyLanguage = settings?.studyLanguage ?? DEFAULT_STUDY_LANGUAGE;
    const level = await languageLevelRepository.getLevel(userId, studyLanguage);

    return ctx.reply(
      messages.settings.overview(getLanguageLabel(studyLanguage), level),
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            'Change language',
            SETTINGS_CHANGE_LANGUAGE_CALLBACK,
          ),
        ],
        [
          Markup.button.callback(
            'Change level',
            SETTINGS_CHANGE_LEVEL_CALLBACK,
          ),
        ],
      ]),
    );
  };

  bot.command('settings', showSettingsOverview);

  bot.action(SETTINGS_CHANGE_LANGUAGE_CALLBACK, async (ctx) => {
    await ctx.answerCbQuery();

    return ctx.editMessageText(
      messages.settings.chooseLanguage,
      buildLanguageInlineKeyboard(SETTINGS_LANGUAGE_CALLBACK_PREFIX),
    );
  });

  bot.action(SETTINGS_CHANGE_LEVEL_CALLBACK, async (ctx) => {
    await ctx.answerCbQuery();

    const userId = getUserId(ctx);
    const settings = await userSettingsRepository.get(userId);
    const studyLanguage = settings?.studyLanguage ?? DEFAULT_STUDY_LANGUAGE;

    return ctx.editMessageText(
      messages.settings.chooseLevel(getLanguageLabel(studyLanguage)),
      buildLevelInlineKeyboard(SETTINGS_LEVEL_CALLBACK_PREFIX, studyLanguage),
    );
  });

  bot.action(
    new RegExp(
      `^${SETTINGS_LANGUAGE_CALLBACK_PREFIX}:(${STUDY_LANGUAGE_CODES_PATTERN})$`,
    ),
    async (ctx) => {
      await ctx.answerCbQuery();

      const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
      const match = new RegExp(
        `^${SETTINGS_LANGUAGE_CALLBACK_PREFIX}:(${STUDY_LANGUAGE_CODES_PATTERN})$`,
      ).exec(data);

      if (!match) {
        return;
      }

      const [, languageCode] = match;

      return ctx.editMessageText(
        messages.settings.chooseLevel(getLanguageLabel(languageCode)),
        buildLevelInlineKeyboard(SETTINGS_LEVEL_CALLBACK_PREFIX, languageCode),
      );
    },
  );

  bot.action(
    new RegExp(
      `^${SETTINGS_LEVEL_CALLBACK_PREFIX}:(${STUDY_LANGUAGE_CODES_PATTERN}):(${PROFICIENCY_LEVELS_PATTERN})$`,
    ),
    async (ctx) => {
      await ctx.answerCbQuery();

      const userId = getUserId(ctx);
      const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
      const match = new RegExp(
        `^${SETTINGS_LEVEL_CALLBACK_PREFIX}:(${STUDY_LANGUAGE_CODES_PATTERN}):(${PROFICIENCY_LEVELS_PATTERN})$`,
      ).exec(data);

      if (!match) {
        return;
      }

      const [, languageCode, level] = match;
      const existingSettings = await userSettingsRepository.get(userId);
      const languageChanged =
        existingSettings?.studyLanguage !== undefined &&
        existingSettings.studyLanguage !== languageCode;

      await userSettingsRepository.save(userId, {
        studyLanguage: languageCode,
        translationLanguage:
          existingSettings?.translationLanguage ?? DEFAULT_TRANSLATION_LANGUAGE,
      });
      await languageLevelRepository.setLevel(userId, languageCode, level);

      return ctx.editMessageText(
        languageChanged
          ? messages.settings.languageChanged(
              getLanguageLabel(languageCode),
              level,
            )
          : messages.settings.levelChanged(
              getLanguageLabel(languageCode),
              level,
            ),
      );
    },
  );
}
