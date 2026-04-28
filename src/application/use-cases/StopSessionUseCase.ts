import type { SessionRepository } from '../../entities/session/api/sessionRepository';

export type StopSessionResult = {
  isActive: boolean;
  kind: 'noActive' | 'stopped';
};

export class StopSessionUseCase {
  private readonly sessionRepository: SessionRepository;

  constructor(sessionRepository: SessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  execute(userId: number): StopSessionResult {
    if (!this.sessionRepository.hasActiveSession(userId)) {
      return {
        kind: 'noActive',
        isActive: false,
      };
    }

    this.sessionRepository.stopSession(userId);

    return {
      kind: 'stopped',
      isActive: false,
    };
  }
}
