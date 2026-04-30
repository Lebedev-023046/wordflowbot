import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryEntryRepository } from '../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { EntryFactory } from '../../src/application/services/EntryFactory';
import { GetLibraryStatisticsUseCase } from '../../src/application/use-cases/GetLibraryStatisticsUseCase';
import { completeEntry } from '../../src/entities/entry/model/entryState';

test('GetLibraryStatisticsUseCase counts only completed words from finished sessions', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const entryFactory = new EntryFactory();

  const finishedSession = await sessions.startSession(1);
  await entries.saveMany([
    completeEntry(entryFactory.createPending(finishedSession.id, 'hassle'), {
      examples: [],
      translation: 'translation for hassle',
      usage: 'A',
    }),
    completeEntry(entryFactory.createPending(finishedSession.id, 'rumor'), {
      examples: [],
      translation: 'translation for rumor',
      usage: 'B',
    }),
  ]);
  await sessions.stopSession(1);

  const activeSession = await sessions.startSession(1);
  await entries.save(
    completeEntry(entryFactory.createPending(activeSession.id, 'peasant'), {
      examples: [],
      translation: 'translation for peasant',
      usage: 'C',
    }),
  );

  const result = await new GetLibraryStatisticsUseCase(
    sessions,
    entries,
  ).execute(1);

  assert.deepEqual(result, {
    activeSession: true,
    finishedSessions: 1,
    totalWords: 2,
    usageA: 1,
    usageB: 1,
    usageC: 0,
  });
});
