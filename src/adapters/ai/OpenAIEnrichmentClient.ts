import OpenAI from 'openai';
import type { EntryEnrichmentClient } from '../../entities/entry/api/entryEnrichmentClient';
import type { EntryEnrichment } from '../../entities/entry/model/entry.types';
import type { Logger } from '../../shared/logging/logger';
import { normalizeEnrichmentTextCasing } from '../../shared/utils/enrichmentText';
import { getErrorDetails } from '../../shared/utils/errors';
import { entryEnrichmentSchema } from './entryEnrichmentSchema';
import { getSystemPrompt } from './system-prompt';

interface OpenAIEnrichmentClientParams {
  apiKey: string;
  debugLogger: Logger;
  usageLogger: Logger;
  model: string;
  serviceTier: 'auto' | 'default' | 'flex' | 'priority' | 'scale';
}

export class OpenAIEnrichmentClient implements EntryEnrichmentClient {
  private readonly client: OpenAI;
  private readonly debugLogger: Logger;
  private readonly model: string;
  private readonly serviceTier: 'auto' | 'default' | 'flex' | 'priority' | 'scale';
  private readonly usageLogger: Logger;

  constructor({
    apiKey,
    debugLogger,
    model,
    serviceTier,
    usageLogger,
  }: OpenAIEnrichmentClientParams) {
    this.client = new OpenAI({ apiKey });
    this.debugLogger = debugLogger;
    this.model = model;
    this.serviceTier = serviceTier;
    this.usageLogger = usageLogger;
  }

  async enrich(text: string): Promise<EntryEnrichment> {
    try {
      const content = getSystemPrompt();

      this.debugLogger.info('Starting enrichment request.', {
        model: this.model,
        text,
      });

      const response = await this.client.responses.create({
        model: this.model,
        service_tier: this.serviceTier,
        input: [
          {
            role: 'system',
            content,
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text,
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'entry_enrichment',
            strict: true,
            schema: entryEnrichmentSchema,
          },
        },
      });

      this.debugLogger.info('Received enrichment response.', {
        model: this.model,
        outputText: response.output_text,
        responseId: response.id,
        serviceTier: response.service_tier,
        text,
      });

      this.usageLogger.info('Usage.', {
        model: this.model,
        responseId: response.id,
        serviceTier: response.service_tier,
        text,
        usage: response.usage ?? null,
      });

      if (!response.output_text) {
        this.debugLogger.error('Empty structured response.', {
          model: this.model,
          responseId: response.id,
          text,
        });
        throw new Error('OpenAI returned an empty structured response.');
      }

      try {
        return normalizeEnrichmentTextCasing(
          JSON.parse(response.output_text) as EntryEnrichment,
        );
      } catch (error) {
        this.debugLogger.error('Failed to parse structured response.', {
          error: getErrorDetails(error),
          model: this.model,
          outputText: response.output_text,
          responseId: response.id,
          text,
        });
        throw error;
      }
    } catch (error) {
      this.debugLogger.error('Enrichment request failed.', {
        error: getErrorDetails(error),
        model: this.model,
        serviceTier: this.serviceTier,
        text,
      });
      throw error;
    }
  }
}
