import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { AddEntriesFromTextUseCase } from '../../../src/application/entries/commands/AddEntriesFromTextUseCase';
import { EntryFactory } from '../../../src/application/services/EntryFactory';
import { EntryParser } from '../../../src/application/services/EntryParser';
import type { EntryEnrichmentClient } from '../../../src/entities/entry/api/entryEnrichmentClient';
import { processEntries } from '../../../src/processes/entry-enrichment/model/processEntries';
import { withMutedConsole } from '../../support/withMutedConsole';

const entryEnrichmentClient: EntryEnrichmentClient = {
  async enrich(text) {
    return {
      usage: 'B',
      translation: `translation for ${text}`,
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
    };
  },
};

test('processEntries returns word-translation previews and completes entries', async () => {
  const entries = new InMemoryEntryRepository();
  const intakeEntries = new AddEntriesFromTextUseCase(
    entries,
    new EntryParser(),
    new EntryFactory(),
  );
  const saved = await intakeEntries.execute({
    sessionId: 'session-1',
    text: 'hassle\npull through',
  });

  assert.equal(saved.kind, 'saved');

  const result = await processEntries({
    entries: saved.entries,
    entryEnrichmentClient,
    entryRepository: entries,
  });

  assert.deepEqual(result, {
    failedCount: 0,
    failureKinds: [],
    succeeded: [
      {
        text: 'hassle',
        translation: 'translation for hassle',
      },
      {
        text: 'pull through',
        translation: 'translation for pull through',
      },
    ],
  });

  const processedEntries = await entries.findBySessionId('session-1');
  assert.deepEqual(
    processedEntries.map((entry) => entry.status),
    ['completed', 'completed'],
  );
  assert.deepEqual(
    processedEntries.map((entry) => entry.translation),
    ['translation for hassle', 'translation for pull through'],
  );
  assert.deepEqual(
    processedEntries.map((entry) => entry.usage),
    ['B', 'B'],
  );
});

test('processEntries classifies insufficient quota failures', async () => {
  const entries = new InMemoryEntryRepository();
  const intakeEntries = new AddEntriesFromTextUseCase(
    entries,
    new EntryParser(),
    new EntryFactory(),
  );
  const saved = await intakeEntries.execute({
    sessionId: 'session-1',
    text: 'hilarious',
  });

  assert.equal(saved.kind, 'saved');

  const failingClient: EntryEnrichmentClient = {
    async enrich() {
      const error = new Error('429 You exceeded your current quota.');
      Object.assign(error, {
        code: 'insufficient_quota',
        status: 429,
        type: 'insufficient_quota',
      });
      throw error;
    },
  };

  const result = await withMutedConsole(() =>
    processEntries({
      entries: saved.entries,
      entryEnrichmentClient: failingClient,
      entryRepository: entries,
    }),
  );

  assert.deepEqual(result, {
    failedCount: 1,
    failureKinds: ['insufficient_quota'],
    succeeded: [],
  });
});

test('processEntries limits enrichment concurrency', async () => {
  const entries = new InMemoryEntryRepository();
  const intakeEntries = new AddEntriesFromTextUseCase(
    entries,
    new EntryParser(),
    new EntryFactory(),
  );
  const saved = await intakeEntries.execute({
    sessionId: 'session-1',
    text: 'hassle\npull through\nrumor\npeasant',
  });

  assert.equal(saved.kind, 'saved');

  let activeRequests = 0;
  let maxActiveRequests = 0;
  const limitedClient: EntryEnrichmentClient = {
    async enrich(text) {
      activeRequests += 1;
      maxActiveRequests = Math.max(maxActiveRequests, activeRequests);

      await new Promise((resolve) => setTimeout(resolve, 10));

      activeRequests -= 1;

      return {
        usage: 'B',
        translation: `translation for ${text}`,
        examples: [],
      };
    },
  };

  await processEntries({
    entries: saved.entries,
    entryEnrichmentClient: limitedClient,
    entryRepository: entries,
  });

  assert.equal(maxActiveRequests, 3);
});
