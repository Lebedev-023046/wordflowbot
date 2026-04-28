import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import {
  GetSessionStatusUseCase,
  type SessionStatusResult,
} from '../../../application/use-cases/GetSessionStatusUseCase';

export function getSessionStatus(
  sessionRepository: SessionRepository,
  entryRepository: EntryRepository,
  userId: number,
): SessionStatusResult {
  return new GetSessionStatusUseCase(
    sessionRepository,
    entryRepository,
  ).execute(userId);
}
