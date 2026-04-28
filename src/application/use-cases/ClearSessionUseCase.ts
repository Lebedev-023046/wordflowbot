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

  preview(userId: number): ClearSessionResult {
    const session = this.sessionRepository.getActiveSession(userId);

    if (!session) {
      return { kind: 'noActive' };
    }

    return {
      clearedEntries: this.entryRepository.findBySessionId(session.id).length,
      kind: 'cleared',
    };
  }

  execute(userId: number): ClearSessionResult {
    const preview = this.preview(userId);

    if (preview.kind === 'noActive') {
      return preview;
    }

    const session = this.sessionRepository.getActiveSession(userId);

    if (!session) {
      return { kind: 'noActive' };
    }

    this.entryRepository.deleteBySessionId(session.id);
    this.sessionRepository.clearSession(userId);

    return {
      clearedEntries: preview.clearedEntries,
      kind: 'cleared',
    };
  }
}
