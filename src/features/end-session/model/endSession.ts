import type { SessionRepository } from '../../../entities/session/api/sessionRepository';

type EndSessionResult = {
  isActive: boolean;
  kind: 'noActive' | 'stopped';
};

export function endSession(
  sessionRepository: SessionRepository,
  userId: number,
): EndSessionResult {
  if (!sessionRepository.hasActiveSession(userId)) {
    return {
      kind: 'noActive',
      isActive: false,
    };
  }

  sessionRepository.stopSession(userId);

  return {
    kind: 'stopped',
    isActive: false,
  };
}
