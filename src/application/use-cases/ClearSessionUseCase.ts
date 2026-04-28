import type { EntryRepository } from '../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../entities/session/api/sessionRepository';

export type ClearSessionResult =
  | { kind: 'noActive' }
  | {
      clearedEntries: number;
      kind: 'cleared';
    };

export class ClearSessionUseCase {
  private readonly sessionRepository: SessionRepository;
  private readonly entryRepository: EntryRepository;

  constructor(
    sessionRepository: SessionRepository,
    entryRepository: EntryRepository,
  ) {
    this.sessionRepository = sessionRepository;
    this.entryRepository = entryRepository;
  }

  async preview(userId: number): Promise<ClearSessionResult> {
    const session = await this.sessionRepository.getActiveSession(userId);

    if (!session) {
      return { kind: 'noActive' };
    }

    return {
      clearedEntries: (await this.entryRepository.findBySessionId(session.id))
        .length,
      kind: 'cleared',
    };
  }

  async execute(userId: number): Promise<ClearSessionResult> {
    const preview = await this.preview(userId);

    if (preview.kind === 'noActive') {
      return preview;
    }

    const session = await this.sessionRepository.getActiveSession(userId);

    if (!session) {
      return { kind: 'noActive' };
    }

    await this.entryRepository.deleteBySessionId(session.id);
    await this.sessionRepository.clearSession(userId);

    return {
      clearedEntries: preview.clearedEntries,
      kind: 'cleared',
    };
  }
}
