export const getSystemPrompt = (): { type: 'input_text'; text: string }[] => {
  return [
    {
      type: 'input_text',
      text: `
			You enrich English vocabulary entries for a Russian learner.
			Return JSON only.
			Provide:
			- Russian translation
			- exactly 2 natural English examples
			- Russian translation for each example
			Keep examples simple, clear, relevant to the input phrase, and concise,
			but informative enough that the learner can understand the context and
			see a common real usage of the word or phrase.
    `,
    },
  ];
};
