import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { ExportFinishedSessionCsvUseCase } from '../../../src/application/export/commands/ExportFinishedSessionCsvUseCase';
import { CsvExporter } from '../../../src/application/services/CsvExporter';
import { EntryFactory } from '../../../src/application/services/EntryFactory';
import { completeEntry } from '../../../src/entities/entry/model/entryState';

test('exportFinishedSessionCsv returns missing when the session does not exist', async () => {
  const useCase = new ExportFinishedSessionCsvUseCase(
    new InMemorySessionRepository(),
    new InMemoryEntryRepository(),
    new CsvExporter(),
  );

  assert.deepEqual(await useCase.execute(1, 'missing'), {
    kind: 'missing',
  });
});

test('exportFinishedSessionCsv returns empty when no completed entries match the filter', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const entryFactory = new EntryFactory();
  const useCase = new ExportFinishedSessionCsvUseCase(
    sessions,
    entries,
    new CsvExporter(),
  );
  const session = await sessions.startSession(1);

  await entries.save(
    completeEntry(entryFactory.createPending(session.id, 'rumor'), {
      examples: [],
      translation: 'translation for rumor',
      usage: 'B',
    }),
  );
  await sessions.stopSession(1);

  const result = await useCase.execute(1, session.id, 'A');

  assert.equal(result.kind, 'empty');

  if (result.kind !== 'empty') {
    return;
  }

  assert.match(result.title, /^\d{2} [A-Z][a-z]{2} \d{2}:\d{2}$/);
});

test('exportFinishedSessionCsv exports completed entries from a finished session', async () => {
  const sessions = new InMemorySessionRepository();
  const entries = new InMemoryEntryRepository();
  const entryFactory = new EntryFactory();
  const useCase = new ExportFinishedSessionCsvUseCase(
    sessions,
    entries,
    new CsvExporter(),
  );
  const session = await sessions.startSession(1);
  session.title = 'Product meeting / Q2';

  await entries.save(
    completeEntry(entryFactory.createPending(session.id, 'rumor'), {
      examples: [
        {
          text: 'Example with rumor.',
          translation: 'Пример с rumor.',
        },
      ],
      translation: 'translation for rumor',
      usage: 'B',
    }),
  );
  await sessions.stopSession(1);

  const result = await useCase.execute(1, session.id);

  assert.deepEqual(result, {
    content:
      '"rumor";"translation for rumor";"Example with rumor.";"Пример с rumor."',
    fileName: 'Product meeting - Q2.csv',
    kind: 'ready',
    title: 'Product meeting / Q2',
  });
});
