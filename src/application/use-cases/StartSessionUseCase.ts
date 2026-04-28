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

  async execute(userId: number): Promise<StartSessionResult> {
    if (await this.sessionRepository.hasActiveSession(userId)) {
      return {
        kind: 'alreadyActive',
        isActive: true,
      };
    }

    await this.sessionRepository.startSession(userId);

    return {
      kind: 'started',
      isActive: true,
    };
  }
}
