import {
  DEFAULT_ENRICHMENT_CONTEXT,
  type EnrichmentContext,
} from '../../entities/entry/api/entryEnrichmentClient';

export const ENTRY_ENRICHMENT_PROMPT_VERSION = 'v3';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  pl: 'Polish',
  ru: 'Russian',
};

function getLanguageName(languageCode: string): string {
  return LANGUAGE_NAMES[languageCode] ?? languageCode;
}

export const getSystemPrompt = (
  context: EnrichmentContext = DEFAULT_ENRICHMENT_CONTEXT,
): { type: 'input_text'; text: string }[] => {
  const studyLanguageName = getLanguageName(context.studyLanguage);
  const translationLanguageName = getLanguageName(context.translationLanguage);

  return [
    {
      type: 'input_text',
      text: `
			You enrich ${studyLanguageName} vocabulary entries for a ${translationLanguageName} learner.
			Assume the learner's current ${studyLanguageName} level is ${context.level}.
			Return JSON only.
			Provide:
			- Usage level as one of:
			  A = 🔥 Most useful
			  B = 👌 Good to know
			  C = 🪶 Rarely used
			- ${translationLanguageName} translation
			- exactly 2 natural ${studyLanguageName} examples
			- ${translationLanguageName} translation for each example
			Classify usage relative to the learner's current level, not for a beginner.
			Do not reserve A only for basic vocabulary.
			Classify A for words or phrases that are most valuable for this learner to
			actively know now because they are common, versatile, or highly useful in
			everyday and professional communication at that level.
			Classify B for useful vocabulary that is worth knowing, but is less urgent
			or less broadly useful for that learner right now.
			Classify C for rare, niche, literary, highly technical, or otherwise
			low-priority vocabulary that the learner can usually skip with little loss.
			Keep examples simple, clear, relevant to the input phrase, and concise,
			but informative enough that the learner can understand the context and
			see a common real usage of the word or phrase.
			Use normal ${translationLanguageName} sentence or dictionary casing.
			Do not write ${translationLanguageName} translations in ALL CAPS.
    `,
    },
  ];
};
