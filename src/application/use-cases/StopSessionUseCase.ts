import type { SessionRepository } from '../../entities/session/api/sessionRepository';

export type StopSessionResult = {
  isActive: boolean;
  kind: 'noActive' | 'stopped';
};

export type StopSessionPreviewResult = {
  isActive: boolean;
  kind: 'active' | 'noActive';
};

export class StopSessionUseCase {
  private readonly sessionRepository: SessionRepository;

  constructor(sessionRepository: SessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  async preview(userId: number): Promise<StopSessionPreviewResult> {
    if (!(await this.sessionRepository.hasActiveSession(userId))) {
      return {
        kind: 'noActive',
        isActive: false,
      };
    }

    return {
      kind: 'active',
      isActive: true,
    };
  }

  async execute(userId: number): Promise<StopSessionResult> {
    const preview = await this.preview(userId);

    if (preview.kind === 'noActive') {
      return {
        kind: 'noActive',
        isActive: false,
      };
    }

    await this.sessionRepository.stopSession(userId);

    return {
      kind: 'stopped',
      isActive: false,
    };
  }
}
