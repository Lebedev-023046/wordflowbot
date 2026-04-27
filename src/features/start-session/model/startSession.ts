import type { SessionRepository } from '../../../entities/session/api/sessionRepository';

type StartSessionResult = {
  isActive: boolean;
  kind: 'alreadyActive' | 'started';
};

export function startSession(
  sessionRepository: SessionRepository,
  userId: number,
): StartSessionResult {
  if (sessionRepository.hasActiveSession(userId)) {
    return {
      kind: 'alreadyActive',
      isActive: true,
    };
  }

  sessionRepository.startSession(userId);

  return {
    kind: 'started',
    isActive: true,
  };
}
