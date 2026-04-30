import type { SessionRepository } from '../../entities/session/api/sessionRepository';

export type RenameSessionResult =
  | { kind: 'emptyTitle' }
  | { kind: 'notFound' }
  | {
      kind: 'renamed';
      title: string;
    };

export class RenameSessionUseCase {
  private readonly sessionRepository: SessionRepository;

  constructor(sessionRepository: SessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  async execute(
    userId: number,
    sessionId: string,
    title: string,
  ): Promise<RenameSessionResult> {
    const normalizedTitle = title.trim();

    if (normalizedTitle.length === 0) {
      return {
        kind: 'emptyTitle',
      };
    }

    const session = await this.sessionRepository.renameSession(
      userId,
      sessionId,
      normalizedTitle,
    );

    if (!session) {
      return {
        kind: 'notFound',
      };
    }

    return {
      kind: 'renamed',
      title: normalizedTitle,
    };
  }
}
