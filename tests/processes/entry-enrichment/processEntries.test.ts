import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/InMemoryEntryRepository';
import { handleTextEntries } from '../../../src/features/intake-entries/model/handleTextEntries';
import { processEntries } from '../../../src/processes/entry-enrichment/model/processEntries';

test('processEntries returns word-translation previews and completes entries', async () => {
  const entries = new InMemoryEntryRepository();
  const saved = handleTextEntries({
    entryRepository: entries,
    sessionId: 'session-1',
    text: 'hassle\npull through',
  });

  assert.equal(saved.kind, 'saved');

  const result = await processEntries({
    entries: saved.entries,
    entryRepository: entries,
  });

  assert.deepEqual(result, {
    failedCount: 0,
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

  const processedEntries = entries.findBySessionId('session-1');
  assert.deepEqual(
    processedEntries.map((entry) => entry.status),
    ['completed', 'completed'],
  );
  assert.deepEqual(
    processedEntries.map((entry) => entry.translation),
    ['translation for hassle', 'translation for pull through'],
  );
});
