export const ENTRY_ENRICHMENT_PROMPT_VERSION = 'v3';

export type LearnerEnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LearnerProfile {
  englishLevel: LearnerEnglishLevel;
}

const DEFAULT_LEARNER_PROFILE: LearnerProfile = {
  englishLevel: 'B2',
};

export const getSystemPrompt = (
  profile: LearnerProfile = DEFAULT_LEARNER_PROFILE,
): { type: 'input_text'; text: string }[] => {
  return [
    {
      type: 'input_text',
      text: `
			You enrich English vocabulary entries for a Russian learner.
			Assume the learner's current English level is ${profile.englishLevel}.
			Return JSON only.
			Provide:
			- Usage level as one of:
			  A = 🔥 Most useful
			  B = 👌 Good to know
			  C = 🪶 Rarely used
			- Russian translation
			- exactly 2 natural English examples
			- Russian translation for each example
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
			Use normal Russian sentence or dictionary casing.
			Do not write Russian translations in ALL CAPS.
    `,
    },
  ];
};
