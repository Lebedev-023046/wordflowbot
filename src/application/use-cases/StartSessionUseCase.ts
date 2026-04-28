import type { SessionRepository } from '../../entities/session/api/sessionRepository';
import { isUniqueConstraintError } from '../../shared/utils/errors';

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

    try {
      await this.sessionRepository.startSession(userId);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          kind: 'alreadyActive',
          isActive: true,
        };
      }

      throw error;
    }

    return {
      kind: 'started',
      isActive: true,
    };
  }
}
