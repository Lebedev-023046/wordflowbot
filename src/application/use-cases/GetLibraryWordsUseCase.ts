import type { EntryRepository } from '../../entities/entry/api/entryRepository';
import type { EntryUsage } from '../../entities/entry/model/entry.types';
import type { SessionRepository } from '../../entities/session/api/sessionRepository';

export interface LibraryWordItem {
  text: string;
  translation: string;
  usage: EntryUsage;
}

export type GetLibraryWordsResult =
  | { kind: 'empty' }
  | {
      items: LibraryWordItem[];
      kind: 'ready';
    };

export class GetLibraryWordsUseCase {
  private readonly sessionRepository: SessionRepository;
  private readonly entryRepository: EntryRepository;

  constructor(
    sessionRepository: SessionRepository,
    entryRepository: EntryRepository,
  ) {
    this.sessionRepository = sessionRepository;
    this.entryRepository = entryRepository;
  }

  async execute(userId: number): Promise<GetLibraryWordsResult> {
    const finishedSessions =
      await this.sessionRepository.findFinishedSessions(userId);
    const items = (
      await this.entryRepository.findCompletedBySessionIds(
        finishedSessions.map((session) => session.id),
      )
    ).map((entry) => ({
      text: entry.text,
      translation: entry.translation,
      usage: entry.usage,
    }));

    if (items.length === 0) {
      return {
        kind: 'empty',
      };
    }

    return {
      items,
      kind: 'ready',
    };
  }
}
