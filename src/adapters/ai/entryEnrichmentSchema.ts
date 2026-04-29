export const entryEnrichmentSchema = {
  additionalProperties: false,
  properties: {
    usage: {
      enum: ['A', 'B', 'C'],
      type: 'string',
    },
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
  required: ['usage', 'translation', 'examples'],
  type: 'object',
} as const;
