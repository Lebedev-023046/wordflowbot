import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { CachedEntryEnrichmentClient } from '../../../src/adapters/ai/CachedEntryEnrichmentClient';
import type { EntryEnrichmentClient } from '../../../src/entities/entry/api/entryEnrichmentClient';
import { createLogger } from '../../../src/shared/logging/logger';
import { withMutedConsole } from '../../support/withMutedConsole';

test('CachedEntryEnrichmentClient reuses persisted enrichments across calls', async () => {
  let callCount = 0;
  const tempDir = await mkdtemp(join(tmpdir(), 'wordflowbot-cache-'));
  const cacheFilePath = join(tempDir, 'enrichment-cache.json');
  const delegate: EntryEnrichmentClient = {
    async enrich(text) {
      callCount += 1;
      return {
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
    },
  };

  const client = new CachedEntryEnrichmentClient({
    cacheFilePath,
    delegate,
    logger: createLogger({
      scope: 'CachedEntryEnrichmentClient',
      warnEnabled: false,
    }),
  });

  const [first, second] = await withMutedConsole(async () => [
    await client.enrich('Hilarious'),
    await client.enrich('hilarious'),
  ]);
  const persistedCache = JSON.parse(
    await readFile(cacheFilePath, 'utf8'),
  ) as Record<string, unknown>;

  assert.deepEqual(first, second);
  assert.equal(callCount, 1);
  assert.deepEqual(Object.keys(persistedCache), ['hilarious']);
});

test('CachedEntryEnrichmentClient stores all entries during concurrent enrichments', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'wordflowbot-cache-'));
  const cacheFilePath = join(tempDir, 'enrichment-cache.json');
  const delegate: EntryEnrichmentClient = {
    async enrich(text) {
      return {
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
    },
  };

  const client = new CachedEntryEnrichmentClient({
    cacheFilePath,
    delegate,
    logger: createLogger({
      scope: 'CachedEntryEnrichmentClient',
      warnEnabled: false,
    }),
  });

  await withMutedConsole(() =>
    Promise.all([
      client.enrich('Hilarious'),
      client.enrich('Rumor'),
      client.enrich('Ratification'),
    ]),
  );

  const persistedCache = JSON.parse(
    await readFile(cacheFilePath, 'utf8'),
  ) as Record<string, unknown>;

  assert.deepEqual(Object.keys(persistedCache).sort(), [
    'hilarious',
    'ratification',
    'rumor',
  ]);
});
