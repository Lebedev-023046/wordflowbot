import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import type { EnrichmentJobQueue } from '../../../src/application/ports/EnrichmentJobQueue';
import { EntryFactory } from '../../../src/application/services/EntryFactory';
import { RetryFailedEntriesUseCase } from '../../../src/application/entries/commands/RetryFailedEntriesUseCase';
import type { Entry } from '../../../src/entities/entry/model/entry.types';
import type { ProcessEntriesResult } from '../../../src/processes/entry-enrichment/model/process-entry.types';

test('RetryFailedEntriesUseCase returns noActive without an active session', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const queue: EnrichmentJobQueue = {
    enqueue: async () => ({
      failedCount: 0,
      failureKinds: [],
      succeeded: [],
    }),
  };

  const result = await new RetryFailedEntriesUseCase(
    sessions,
    entries,
    queue,
  ).execute(1);

  assert.deepEqual(result, { kind: 'noActive' });
});

test('RetryFailedEntriesUseCase returns noFailed when there are no failed items', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  await sessions.startSession(1);

  const queue: EnrichmentJobQueue = {
    enqueue: async () => ({
      failedCount: 0,
      failureKinds: [],
      succeeded: [],
    }),
  };

  const result = await new RetryFailedEntriesUseCase(
    sessions,
    entries,
    queue,
  ).execute(1);

  assert.deepEqual(result, { kind: 'noFailed' });
});

test('RetryFailedEntriesUseCase retries failed items only and resets them to pending before enqueue', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const session = await sessions.startSession(1);
  const entryFactory = new EntryFactory();
  const failedEntry = {
    ...entryFactory.createPending(session.id, 'hassle'),
    errorMessage: 'Rate limit exceeded',
    status: 'failed' as const,
  };
  const completedEntry = {
    ...entryFactory.createPending(session.id, 'pull through'),
    status: 'completed' as const,
    translation: 'translation for pull through',
    usage: 'B' as const,
  };

  await entries.saveMany([failedEntry, completedEntry]);

  let queuedEntriesSnapshot: Entry[] = [];
  const processingResult: ProcessEntriesResult = {
    failedCount: 0,
    failureKinds: [],
    succeeded: [
      {
        text: 'hassle',
        translation: 'translation for hassle',
      },
    ],
  };
  const queue: EnrichmentJobQueue = {
    enqueue: async (queuedEntries) => {
      queuedEntriesSnapshot = queuedEntries;
      return processingResult;
    },
  };

  const result = await new RetryFailedEntriesUseCase(
    sessions,
    entries,
    queue,
  ).execute(1);

  assert.deepEqual(result, {
    kind: 'retried',
    processingResult,
    retryCount: 1,
  });
  assert.equal(queuedEntriesSnapshot.length, 1);
  assert.equal(queuedEntriesSnapshot[0].text, 'hassle');
  assert.equal(queuedEntriesSnapshot[0].status, 'pending');
  assert.equal(queuedEntriesSnapshot[0].errorMessage, null);

  const persistedFailedEntry = await entries.findById(failedEntry.id);
  assert.equal(persistedFailedEntry?.status, 'pending');
  assert.equal(persistedFailedEntry?.errorMessage, null);
});
