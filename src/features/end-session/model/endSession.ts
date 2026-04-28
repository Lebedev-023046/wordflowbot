import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import {
  StopSessionUseCase,
  type StopSessionResult,
} from '../../../application/use-cases/StopSessionUseCase';

export function endSession(
  sessionRepository: SessionRepository,
  userId: number,
): StopSessionResult {
  return new StopSessionUseCase(sessionRepository).execute(userId);
}
