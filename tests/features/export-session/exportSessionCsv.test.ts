import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import type { EntryEnrichmentClient } from '../../../src/entities/entry/api/entryEnrichmentClient';
import { exportSessionCsv } from '../../../src/features/export-session/model/exportSessionCsv';
import { handleTextEntries } from '../../../src/features/intake-entries/model/handleTextEntries';
import { processEntries } from '../../../src/processes/entry-enrichment/model/processEntries';

test('exportSessionCsv returns noActive when there is no active session', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();

  assert.deepEqual(await exportSessionCsv(sessions, entries, 1), {
    kind: 'noActive',
  });
});

test('exportSessionCsv returns empty when no completed entries exist', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const session = await sessions.startSession(1);

  await handleTextEntries({
    entryRepository: entries,
    sessionId: session.id,
    text: 'hilarious',
  });

  assert.deepEqual(await exportSessionCsv(sessions, entries, 1), {
    kind: 'empty',
  });
});

test('exportSessionCsv returns csv for completed entries only', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const session = await sessions.startSession(1);
  const saved = await handleTextEntries({
    entryRepository: entries,
    sessionId: session.id,
    text: 'hilarious\nrumor',
  });

  assert.equal(saved.kind, 'saved');

  const entryEnrichmentClient: EntryEnrichmentClient = {
    async enrich(text) {
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
    },
  };

  await processEntries({
    entries: saved.entries,
    entryEnrichmentClient,
    entryRepository: entries,
  });

  const result = await exportSessionCsv(sessions, entries, 1);

  assert.equal(result.kind, 'ready');

  if (result.kind !== 'ready') {
    return;
  }

  assert.equal(result.fileName, `session-${session.id}.csv`);
  assert.equal(
    result.content,
    [
      '"hilarious";"translation for hilarious";"Example with hilarious.";"Пример с hilarious.";"Another example with hilarious.";"Еще один пример с hilarious."',
      '"rumor";"translation for rumor";"Example with rumor.";"Пример с rumor.";"Another example with rumor.";"Еще один пример с rumor."',
    ].join('\n'),
  );
});
