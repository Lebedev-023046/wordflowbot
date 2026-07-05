import { Markup } from 'telegraf';

export const STUDY_LANGUAGES: Array<{ code: string; label: string }> = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'pl', label: '🇵🇱 Polish' },
];

export const PROFICIENCY_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export const STUDY_LANGUAGE_CODES_PATTERN = STUDY_LANGUAGES.map(
  (language) => language.code,
).join('|');

export const PROFICIENCY_LEVELS_PATTERN = PROFICIENCY_LEVELS.join('|');

export function getLanguageLabel(languageCode: string): string {
  return (
    STUDY_LANGUAGES.find((language) => language.code === languageCode)?.label ??
    languageCode
  );
}

export function buildLanguageInlineKeyboard(callbackPrefix: string) {
  return Markup.inlineKeyboard(
    STUDY_LANGUAGES.map((language) => [
      Markup.button.callback(
        language.label,
        `${callbackPrefix}:${language.code}`,
      ),
    ]),
  );
}

export function buildLevelInlineKeyboard(
  callbackPrefix: string,
  languageCode: string,
) {
  return Markup.inlineKeyboard([
    PROFICIENCY_LEVELS.slice(0, 3).map((level) =>
      Markup.button.callback(
        level,
        `${callbackPrefix}:${languageCode}:${level}`,
      ),
    ),
    PROFICIENCY_LEVELS.slice(3).map((level) =>
      Markup.button.callback(
        level,
        `${callbackPrefix}:${languageCode}:${level}`,
      ),
    ),
  ]);
}
