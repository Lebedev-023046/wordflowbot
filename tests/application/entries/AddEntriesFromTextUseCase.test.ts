import assert from 'node:assert/strict';
import test from 'node:test';
import { EntryFactory } from '../../../src/application/services/EntryFactory';
import { EntryParser } from '../../../src/application/services/EntryParser';
import { AddEntriesFromTextUseCase } from '../../../src/application/entries/commands/AddEntriesFromTextUseCase';
import type { EntryRepository } from '../../../src/entities/entry/api/entryRepository';

test('AddEntriesFromTextUseCase saves non-conflicting entries when saveMany hits a duplicate race', async () => {
  const entryFactory = new EntryFactory();
  const parser = new EntryParser();
  const persistedEntryIds = new Set<string>();
  const duplicateText = 'hassle';
  let saveManyCalls = 0;

  const entries: EntryRepository = {
    async deleteBySessionId() {},
    async existsInSession() {
      return false;
    },
    async findCompletedBySessionIds() {
      return [];
    },
    async findById(entryId) {
      if (!persistedEntryIds.has(entryId)) {
        return null;
      }

      return entryFactory.createPending('session-1', 'placeholder');
    },
    async findBySessionId() {
      return [];
    },
    async save(entry) {
      if (entry.text === duplicateText) {
        const error = new Error('Unique constraint failed on the fields');
        (error as Error & { code?: string }).code = 'P2002';
        throw error;
      }

      persistedEntryIds.add(entry.id);
    },
    async saveMany(batch) {
      saveManyCalls += 1;
      assert.equal(batch.length, 2);

      const error = new Error('Unique constraint failed on the fields');
      (error as Error & { code?: string }).code = 'P2002';
      throw error;
    },
    async update() {},
  };

  const result = await new AddEntriesFromTextUseCase(
    entries,
    parser,
    entryFactory,
  ).execute({
    sessionId: 'session-1',
    text: 'hassle\npull through',
  });

  assert.equal(saveManyCalls, 1);
  assert.deepEqual(result, {
    count: 1,
    entries: result.kind === 'saved' ? result.entries : [],
    kind: 'saved',
  });
  assert.equal(result.kind, 'saved');
  assert.deepEqual(
    result.entries.map((entry) => entry.text),
    ['pull through'],
  );
});

test('AddEntriesFromTextUseCase returns duplicatesOnly when every entry loses the duplicate race', async () => {
  const entryFactory = new EntryFactory();
  const parser = new EntryParser();

  const entries: EntryRepository = {
    async deleteBySessionId() {},
    async existsInSession() {
      return false;
    },
    async findCompletedBySessionIds() {
      return [];
    },
    async findById() {
      return null;
    },
    async findBySessionId() {
      return [];
    },
    async save() {
      const error = new Error('Unique constraint failed on the fields');
      (error as Error & { code?: string }).code = 'P2002';
      throw error;
    },
    async saveMany() {
      const error = new Error('Unique constraint failed on the fields');
      (error as Error & { code?: string }).code = 'P2002';
      throw error;
    },
    async update() {},
  };

  const result = await new AddEntriesFromTextUseCase(
    entries,
    parser,
    entryFactory,
  ).execute({
    sessionId: 'session-1',
    text: 'hassle',
  });

  assert.deepEqual(result, { kind: 'duplicatesOnly' });
});
