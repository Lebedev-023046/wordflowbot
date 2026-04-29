import type { EntryEnrichment } from '../../entities/entry/model/entry.types';

export function normalizeEnrichmentTextCasing(
  enrichment: EntryEnrichment,
): EntryEnrichment {
  return {
    examples: enrichment.examples.map((example) => ({
      ...example,
      text: normalizeSentenceText(example.text),
      translation: normalizeSentenceText(
        normalizeRussianTextCasing(example.translation),
      ),
    })),
    translation: normalizeRussianTextCasing(enrichment.translation),
    usage: enrichment.usage,
  };
}

export function normalizeRussianTextCasing(text: string): string {
  const hasLowercaseCyrillic = /[а-яё]/.test(text);
  const hasUppercaseCyrillic = /[А-ЯЁ]/.test(text);

  if (!hasUppercaseCyrillic || hasLowercaseCyrillic) {
    return text;
  }

  return text.toLocaleLowerCase('ru-RU');
}

export function normalizeSentenceText(text: string): string {
  const match = text.match(/\S/);

  if (!match || match.index === undefined) {
    return text;
  }

  const firstCharacterIndex = match.index;
  const firstCharacter = text[firstCharacterIndex];

  return (
    text.slice(0, firstCharacterIndex) +
    firstCharacter.toLocaleUpperCase('ru-RU') +
    text.slice(firstCharacterIndex + 1)
  );
}
