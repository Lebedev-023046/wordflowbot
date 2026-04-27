export const entryEnrichmentSchema = {
  additionalProperties: false,
  properties: {
    examples: {
      items: {
        additionalProperties: false,
        properties: {
          text: {
            type: 'string',
          },
          translation: {
            type: 'string',
          },
        },
        required: ['text', 'translation'],
        type: 'object',
      },
      maxItems: 3,
      minItems: 2,
      type: 'array',
    },
    translation: {
      type: 'string',
    },
  },
  required: ['translation', 'examples'],
  type: 'object',
} as const;
