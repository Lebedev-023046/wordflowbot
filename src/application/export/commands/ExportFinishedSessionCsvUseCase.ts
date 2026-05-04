import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import { isCompletedEntry } from '../../../entities/entry/model/entryState';
import type { EntryUsage } from '../../../entities/entry/model/entry.types';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { resolveSessionTitle } from '../../../shared/utils/sessionTitle';
import { CsvExporter } from '../../services/CsvExporter';

export type ExportFinishedSessionCsvFilter = EntryUsage | 'all';

export type ExportFinishedSessionCsvResult =
  | { kind: 'missing' }
  | {
      kind: 'empty';
      title: string;
    }
  | {
      content: string;
      fileName: string;
      kind: 'ready';
      title: string;
    };

export class ExportFinishedSessionCsvUseCase {
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
    sessionId: string,
    filter: ExportFinishedSessionCsvFilter = 'all',
  ): Promise<ExportFinishedSessionCsvResult> {
    const session = await this.sessionRepository.findFinishedSessionById(
      userId,
      sessionId,
    );

    if (!session) {
      return { kind: 'missing' };
    }

    const title = resolveSessionTitle(session);
    const sessionEntries = await this.entryRepository.findBySessionId(
      session.id,
    );
    const completedEntries = sessionEntries
      .filter(isCompletedEntry)
      .filter((entry) => filter === 'all' || entry.usage === filter);

    if (completedEntries.length === 0) {
      return {
        kind: 'empty',
        title,
      };
    }

    return {
      content: this.csvExporter.export(completedEntries),
      fileName: `${sanitizeFileName(title)}.csv`,
      kind: 'ready',
      title,
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
