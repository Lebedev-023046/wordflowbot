import assert from 'node:assert/strict';
import test from 'node:test';
import { CachedEntryEnrichmentClient } from '../../../src/adapters/ai/CachedEntryEnrichmentClient';
import type { EnrichmentCacheRepository } from '../../../src/application/ports/EnrichmentCacheRepository';
import type { EntryEnrichmentClient } from '../../../src/entities/entry/api/entryEnrichmentClient';
import type { EntryEnrichment } from '../../../src/entities/entry/model/entry.types';
import { createLogger } from '../../../src/shared/logging/logger';
import { withMutedConsole } from '../../support/withMutedConsole';

test('CachedEntryEnrichmentClient reuses persisted enrichments across calls', async () => {
  let callCount = 0;
  const cacheRepository = new InMemoryEnrichmentCacheRepository();
  const delegate: EntryEnrichmentClient = {
    async enrich(text) {
      callCount += 1;
      return createEnrichment(text);
    },
  };

  const firstClient = new CachedEntryEnrichmentClient({
    cacheRepository,
    delegate,
    logger: createLogger({
      scope: 'CachedEntryEnrichmentClient',
      warnEnabled: false,
    }),
    model: 'gpt-5.4-mini',
    promptVersion: 'v1',
  });
  const secondClient = new CachedEntryEnrichmentClient({
    cacheRepository,
    delegate,
    logger: createLogger({
      scope: 'CachedEntryEnrichmentClient',
      warnEnabled: false,
    }),
    model: 'gpt-5.4-mini',
    promptVersion: 'v1',
  });

  const [first, second] = await withMutedConsole(async () => [
    await firstClient.enrich('Hilarious'),
    await secondClient.enrich('hilarious'),
  ]);

  assert.deepEqual(first, second);
  assert.equal(callCount, 1);
  assert.deepEqual(cacheRepository.getStoredKeys(), [
    'hilarious:gpt-5.4-mini:v1',
  ]);
});

test('CachedEntryEnrichmentClient deduplicates concurrent requests for the same text', async () => {
  let callCount = 0;
  const cacheRepository = new InMemoryEnrichmentCacheRepository();
  const delegate: EntryEnrichmentClient = {
    async enrich(text) {
      callCount += 1;
      await Promise.resolve();
      return createEnrichment(text);
    },
  };

  const client = new CachedEntryEnrichmentClient({
    cacheRepository,
    delegate,
    logger: createLogger({
      scope: 'CachedEntryEnrichmentClient',
      warnEnabled: false,
    }),
    model: 'gpt-5.4-mini',
    promptVersion: 'v1',
  });

  const results = await withMutedConsole(() =>
    Promise.all([client.enrich('Hilarious'), client.enrich('hilarious')]),
  );

  assert.deepEqual(results[0], results[1]);
  assert.equal(callCount, 1);
});

test('CachedEntryEnrichmentClient keeps distinct prompt versions isolated', async () => {
  let callCount = 0;
  const cacheRepository = new InMemoryEnrichmentCacheRepository();
  const delegate: EntryEnrichmentClient = {
    async enrich(text) {
      callCount += 1;
      return createEnrichment(text);
    },
  };

  const firstClient = new CachedEntryEnrichmentClient({
    cacheRepository,
    delegate,
    logger: createLogger({
      scope: 'CachedEntryEnrichmentClient',
      warnEnabled: false,
    }),
    model: 'gpt-5.4-mini',
    promptVersion: 'v1',
  });
  const secondClient = new CachedEntryEnrichmentClient({
    cacheRepository,
    delegate,
    logger: createLogger({
      scope: 'CachedEntryEnrichmentClient',
      warnEnabled: false,
    }),
    model: 'gpt-5.4-mini',
    promptVersion: 'v2',
  });

  await withMutedConsole(async () => {
    await firstClient.enrich('hilarious');
    await secondClient.enrich('hilarious');
  });

  assert.equal(callCount, 2);
  assert.deepEqual(cacheRepository.getStoredKeys().sort(), [
    'hilarious:gpt-5.4-mini:v1',
    'hilarious:gpt-5.4-mini:v2',
  ]);
});

class InMemoryEnrichmentCacheRepository implements EnrichmentCacheRepository {
  private readonly enrichmentsByKey = new Map<string, EntryEnrichment>();

  async findByKey({
    model,
    normalizedText,
    promptVersion,
  }: {
    model: string;
    normalizedText: string;
    promptVersion: string;
  }): Promise<EntryEnrichment | null> {
    const enrichment = this.enrichmentsByKey.get(
      `${normalizedText}:${model}:${promptVersion}`,
    );

    return enrichment ? cloneEnrichment(enrichment) : null;
  }

  getStoredKeys(): string[] {
    return Array.from(this.enrichmentsByKey.keys());
  }

  async save({
    enrichment,
    model,
    normalizedText,
    promptVersion,
  }: {
    enrichment: EntryEnrichment;
    model: string;
    normalizedText: string;
    promptVersion: string;
    sourceText: string;
  }): Promise<void> {
    this.enrichmentsByKey.set(
      `${normalizedText}:${model}:${promptVersion}`,
      cloneEnrichment(enrichment),
    );
  }
}

function cloneEnrichment(enrichment: EntryEnrichment): EntryEnrichment {
  return {
    examples: enrichment.examples.map((example) => ({ ...example })),
    translation: enrichment.translation,
    usage: enrichment.usage,
  };
}

function createEnrichment(text: string): EntryEnrichment {
  return {
    usage: 'B',
    examples: [
      {
        text: `Example with ${text}.`,
        translation: `Пример с ${text}.`,
      },
      {
        text: `Another example with ${text}.`,
        translation: `Еще один пример с ${text}.`,
      },
    ],
    translation: `translation for ${text}`,
  };
}
