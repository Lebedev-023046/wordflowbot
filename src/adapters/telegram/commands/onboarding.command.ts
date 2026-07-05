import type { Telegraf } from 'telegraf';
import type { LanguageLevelRepository } from '../../../application/ports/LanguageLevelRepository';
import type { UserSettingsRepository } from '../../../application/ports/UserSettingsRepository';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { messages } from '../../../shared/i18n/messages';
import { getHomeScreenState } from '../lib/getHomeScreenState';
import { getUserId } from '../lib/getUserId';
import {
  buildLevelInlineKeyboard,
  getLanguageLabel,
  PROFICIENCY_LEVELS_PATTERN,
  STUDY_LANGUAGE_CODES_PATTERN,
} from '../lib/languageSelection';
import { replyWithHomeScreenState } from '../lib/replyWithHomeScreenState';

export const ONBOARDING_LANGUAGE_CALLBACK_PREFIX = 'onboarding_lang';
export const ONBOARDING_LEVEL_CALLBACK_PREFIX = 'onboarding_level';

const DEFAULT_TRANSLATION_LANGUAGE = 'ru';

export function registerOnboardingCommand(
  bot: Telegraf,
  entries: EntryRepository,
  sessions: SessionRepository,
  userSettingsRepository: UserSettingsRepository,
  languageLevelRepository: LanguageLevelRepository,
) {
  bot.action(
    new RegExp(
      `^${ONBOARDING_LANGUAGE_CALLBACK_PREFIX}:(${STUDY_LANGUAGE_CODES_PATTERN})$`,
    ),
    async (ctx) => {
      await ctx.answerCbQuery();

      const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
      const match = new RegExp(
        `^${ONBOARDING_LANGUAGE_CALLBACK_PREFIX}:(${STUDY_LANGUAGE_CODES_PATTERN})$`,
      ).exec(data);

      if (!match) {
        return;
      }

      const [, languageCode] = match;

      return ctx.editMessageText(
        messages.onboarding.chooseLevel(getLanguageLabel(languageCode)),
        buildLevelInlineKeyboard(
          ONBOARDING_LEVEL_CALLBACK_PREFIX,
          languageCode,
        ),
      );
    },
  );

  bot.action(
    new RegExp(
      `^${ONBOARDING_LEVEL_CALLBACK_PREFIX}:(${STUDY_LANGUAGE_CODES_PATTERN}):(${PROFICIENCY_LEVELS_PATTERN})$`,
    ),
    async (ctx) => {
      await ctx.answerCbQuery();

      const userId = getUserId(ctx);
      const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';
      const match = new RegExp(
        `^${ONBOARDING_LEVEL_CALLBACK_PREFIX}:(${STUDY_LANGUAGE_CODES_PATTERN}):(${PROFICIENCY_LEVELS_PATTERN})$`,
      ).exec(data);

      if (!match) {
        return;
      }

      const [, languageCode, level] = match;

      await userSettingsRepository.save(userId, {
        studyLanguage: languageCode,
        translationLanguage: DEFAULT_TRANSLATION_LANGUAGE,
      });
      await languageLevelRepository.setLevel(userId, languageCode, level);

      await ctx.editMessageText(
        messages.onboarding.completed(getLanguageLabel(languageCode), level),
      );

      const state = await getHomeScreenState(entries, sessions, userId);
      return replyWithHomeScreenState(ctx, state);
    },
  );
}
