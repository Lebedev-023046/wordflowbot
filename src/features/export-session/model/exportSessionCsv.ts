import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { Entry } from '../../../entities/entry/model/entry.types';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';

type ExportSessionCsvResult =
  | { kind: 'noActive' }
  | { kind: 'empty' }
  | {
      content: string;
      fileName: string;
      kind: 'ready';
    };

export function exportSessionCsv(
  sessionRepository: SessionRepository,
  entryRepository: EntryRepository,
  userId: number,
): ExportSessionCsvResult {
  const session = sessionRepository.getActiveSession(userId);

  if (!session) {
    return { kind: 'noActive' };
  }

  const completedEntries = entryRepository
    .findBySessionId(session.id)
    .filter((entry) => entry.status === 'completed' && entry.translation !== null);

  if (completedEntries.length === 0) {
    return { kind: 'empty' };
  }

  return {
    content: buildSessionCsv(completedEntries),
    fileName: `session-${session.id}.csv`,
    kind: 'ready',
  };
}

function buildSessionCsv(entries: Entry[]): string {
  const rows = entries.map((entry) => {
    const row = [entry.text, entry.translation ?? ''];

    for (const example of entry.examples) {
      row.push(example.text, example.translation);
    }

    return row;
  });

  return rows.map((row) => row.map(escapeCsvValue).join(';')).join('\n');
}

function escapeCsvValue(value: string): string {
  const normalized = value.replaceAll('"', '""');
  return `"${normalized}"`;
}
