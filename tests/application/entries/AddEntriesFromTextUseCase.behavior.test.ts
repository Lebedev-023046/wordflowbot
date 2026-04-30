import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { AddEntriesFromTextUseCase } from '../../../src/application/entries/commands/AddEntriesFromTextUseCase';
import { EntryFactory } from '../../../src/application/services/EntryFactory';
import { EntryParser } from '../../../src/application/services/EntryParser';

test('handleTextEntries returns empty for blank input', async () => {
  const entries = new InMemoryEntryRepository();
  const useCase = new AddEntriesFromTextUseCase(
    entries,
    new EntryParser(),
    new EntryFactory(),
  );

  const result = await useCase.execute({
    sessionId: 'session-1',
    text: ' \n \n',
  });

  assert.deepEqual(result, { kind: 'empty' });
});

test('handleTextEntries returns duplicatesOnly when all entries already exist', async () => {
  const entries = new InMemoryEntryRepository();
  const useCase = new AddEntriesFromTextUseCase(
    entries,
    new EntryParser(),
    new EntryFactory(),
  );
  await useCase.execute({
    sessionId: 'session-1',
    text: 'hassle',
  });

  const result = await useCase.execute({
    sessionId: 'session-1',
    text: 'HASSLE',
  });

  assert.deepEqual(result, { kind: 'duplicatesOnly' });
});

test('handleTextEntries saves unique entries and starts background processing', async () => {
  const entries = new InMemoryEntryRepository();
  const useCase = new AddEntriesFromTextUseCase(
    entries,
    new EntryParser(),
    new EntryFactory(),
  );

  const result = await useCase.execute({
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

  const savedEntries = await entries.findBySessionId('session-1');
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
