import type { EntryRepository } from '../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../entities/session/api/sessionRepository';
import { isCompletedEntry } from '../../entities/entry/model/entryState';
import { CsvExporter } from '../services/CsvExporter';

export type ExportSessionCsvResult =
  | { kind: 'noActive' }
  | { kind: 'empty' }
  | {
      content: string;
      fileName: string;
      kind: 'ready';
    };

export class ExportSessionCsvUseCase {
  private readonly sessionRepository: SessionRepository;
  private readonly entryRepository: EntryRepository;
  private readonly csvExporter: CsvExporter;

  constructor(
    sessionRepository: SessionRepository,
    entryRepository: EntryRepository,
    csvExporter: CsvExporter,
  ) {
    this.sessionRepository = sessionRepository;
    this.entryRepository = entryRepository;
    this.csvExporter = csvExporter;
  }

  execute(userId: number): ExportSessionCsvResult {
    const session = this.sessionRepository.getActiveSession(userId);

    if (!session) {
      return { kind: 'noActive' };
    }

    const completedEntries = this.entryRepository
      .findBySessionId(session.id)
      .filter(isCompletedEntry);

    if (completedEntries.length === 0) {
      return { kind: 'empty' };
    }

    return {
      content: this.csvExporter.export(completedEntries),
      fileName: `session-${session.id}.csv`,
      kind: 'ready',
    };
  }
}
