import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import type { EntryEnrichmentClient } from '../../../src/entities/entry/api/entryEnrichmentClient';
import { handleTextEntries } from '../../../src/features/intake-entries/model/handleTextEntries';
import { getSessionStatus } from '../../../src/features/session-status/model/getSessionStatus';
import { processEntries } from '../../../src/processes/entry-enrichment/model/processEntries';
import { withMutedConsole } from '../../support/withMutedConsole';

test('getSessionStatus returns counts and failure details for an active session', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const session = await sessions.startSession(1);
  const saved = await handleTextEntries({
    entryRepository: entries,
    sessionId: session.id,
    text: 'hilarious\npull through',
  });

  assert.equal(saved.kind, 'saved');

  const entryEnrichmentClient: EntryEnrichmentClient = {
    async enrich(text) {
      if (text === 'hilarious') {
        throw new Error('Rate limit exceeded');
      }

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

  await withMutedConsole(() =>
    processEntries({
      entries: saved.entries,
      entryEnrichmentClient,
      entryRepository: entries,
    }),
  );

  const result = await getSessionStatus(sessions, entries, 1);

  assert.deepEqual(result, {
    completedEntries: 1,
    completedEntrySummaries: [
      {
        text: 'pull through',
        translation: 'translation for pull through',
      },
    ],
    failedEntries: [
      {
        errorMessage:
          'Something went wrong while preparing this item. Please try again.',
        text: 'hilarious',
      },
    ],
    failedEntriesCount: 1,
    kind: 'active',
    pendingEntries: 0,
    totalEntries: 2,
  });
});
