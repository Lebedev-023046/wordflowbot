import type { EntryRepository } from '../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../entities/session/api/sessionRepository';
import { isCompletedEntry } from '../../entities/entry/model/entryState';
import type { EntryUsage } from '../../entities/entry/model/entry.types';
import { resolveSessionTitle } from '../../shared/utils/sessionTitle';
import { CsvExporter } from '../services/CsvExporter';

export type ExportSessionCsvFilter = EntryUsage | 'all';

export type ExportSessionCsvResult =
  | { kind: 'noActive' }
  | {
      hasEntries: boolean;
      hasFailedEntries: boolean;
      kind: 'empty';
    }
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

  async execute(
    userId: number,
    filter: ExportSessionCsvFilter = 'all',
  ): Promise<ExportSessionCsvResult> {
    const session = await this.sessionRepository.getActiveSession(userId);

    if (!session) {
      return { kind: 'noActive' };
    }

    const sessionEntries = await this.entryRepository.findBySessionId(
      session.id,
    );

    const completedEntries = sessionEntries
      .filter(isCompletedEntry)
      .filter((entry) => filter === 'all' || entry.usage === filter);

    if (completedEntries.length === 0) {
      return {
        hasEntries: sessionEntries.length > 0,
        hasFailedEntries: sessionEntries.some(
          (entry) => entry.status === 'failed',
        ),
        kind: 'empty',
      };
    }

    return {
      content: this.csvExporter.export(completedEntries),
      fileName: `${sanitizeFileName(resolveSessionTitle(session))}.csv`,
      kind: 'ready',
    };
  }
}

function sanitizeFileName(value: string): string {
  const normalized = value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/-+/g, '-');

  return normalized.length > 0 ? normalized : 'session';
}
