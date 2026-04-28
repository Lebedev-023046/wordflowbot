import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { CsvExporter } from '../../../application/services/CsvExporter';
import {
  ExportSessionCsvUseCase,
  type ExportSessionCsvResult,
} from '../../../application/use-cases/ExportSessionCsvUseCase';

export function exportSessionCsv(
  sessionRepository: SessionRepository,
  entryRepository: EntryRepository,
  userId: number,
): Promise<ExportSessionCsvResult> {
  return new ExportSessionCsvUseCase(
    sessionRepository,
    entryRepository,
    new CsvExporter(),
  ).execute(userId);
}
