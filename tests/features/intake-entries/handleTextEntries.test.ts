import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/InMemoryEntryRepository';
import { handleTextEntries } from '../../../src/features/intake-entries/model/handleTextEntries';

test('handleTextEntries returns empty for blank input', () => {
  const entries = new InMemoryEntryRepository();

  const result = handleTextEntries({
    entryRepository: entries,
    sessionId: 'session-1',
    text: ' \n \n',
  });

  assert.deepEqual(result, { kind: 'empty' });
});

test('handleTextEntries returns duplicatesOnly when all entries already exist', () => {
  const entries = new InMemoryEntryRepository();
  handleTextEntries({
    entryRepository: entries,
    sessionId: 'session-1',
    text: 'hassle',
  });

  const result = handleTextEntries({
    entryRepository: entries,
    sessionId: 'session-1',
    text: 'HASSLE',
  });

  assert.deepEqual(result, { kind: 'duplicatesOnly' });
});

test('handleTextEntries saves unique entries and starts background processing', async () => {
  const entries = new InMemoryEntryRepository();

  const result = handleTextEntries({
    entryRepository: entries,
    sessionId: 'session-1',
    text: 'hassle\nHASSLE\npull through',
  });

  assert.deepEqual(result, {
    count: 2,
    entries: result.kind === 'saved' ? result.entries : [],
    kind: 'saved',
  });

  assert.equal(result.kind, 'saved');
  assert.equal(result.entries.length, 2);

  const savedEntries = entries.findBySessionId('session-1');
  assert.equal(savedEntries.length, 2);
  assert.deepEqual(
    savedEntries.map((entry) => entry.text),
    ['hassle', 'pull through'],
  );
  assert.deepEqual(
    savedEntries.map((entry) => entry.status),
    ['pending', 'pending'],
  );
});
