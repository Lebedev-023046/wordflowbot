import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import {
  StartSessionUseCase,
  type StartSessionResult,
} from '../../../application/use-cases/StartSessionUseCase';

export function startSession(
  sessionRepository: SessionRepository,
  userId: number,
): Promise<StartSessionResult> {
  return new StartSessionUseCase(sessionRepository).execute(userId);
}
