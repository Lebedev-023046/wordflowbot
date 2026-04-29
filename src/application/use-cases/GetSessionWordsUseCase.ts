import type { EntryRepository } from '../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../entities/session/api/sessionRepository';
import { isCompletedEntry } from '../../entities/entry/model/entryState';

export interface CompletedSessionWordItem {
  text: string;
  translation: string;
}

export interface FailedSessionWordItem {
  text: string;
}

export type GetSessionWordsResult =
  | { kind: 'noActive' }
  | { kind: 'empty' }
  | {
      completedItems: CompletedSessionWordItem[];
      failedItems: FailedSessionWordItem[];
      kind: 'active';
    };

export class GetSessionWordsUseCase {
  private readonly sessionRepository: SessionRepository;
  private readonly entryRepository: EntryRepository;

  constructor(
    sessionRepository: SessionRepository,
    entryRepository: EntryRepository,
  ) {
    this.sessionRepository = sessionRepository;
    this.entryRepository = entryRepository;
  }

  async execute(userId: number): Promise<GetSessionWordsResult> {
    const session = await this.sessionRepository.getActiveSession(userId);

    if (!session) {
      return { kind: 'noActive' };
    }

    const entries = await this.entryRepository.findBySessionId(session.id);

    if (entries.length === 0) {
      return { kind: 'empty' };
    }

    return {
      completedItems: entries
        .filter(isCompletedEntry)
        .map((entry) => ({
          text: entry.text,
          translation: entry.translation,
        })),
      failedItems: entries
        .filter((entry) => entry.status === 'failed')
        .map((entry) => ({
          text: entry.text,
        })),
      kind: 'active',
    };
  }
}
