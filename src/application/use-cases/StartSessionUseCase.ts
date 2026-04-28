import type { SessionRepository } from '../../entities/session/api/sessionRepository';

export type StartSessionResult = {
  isActive: boolean;
  kind: 'alreadyActive' | 'started';
};

export class StartSessionUseCase {
  private readonly sessionRepository: SessionRepository;

  constructor(sessionRepository: SessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  execute(userId: number): StartSessionResult {
    if (this.sessionRepository.hasActiveSession(userId)) {
      return {
        kind: 'alreadyActive',
        isActive: true,
      };
    }

    this.sessionRepository.startSession(userId);

    return {
      kind: 'started',
      isActive: true,
    };
  }
}
