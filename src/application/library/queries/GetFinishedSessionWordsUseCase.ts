import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import { isCompletedEntry } from '../../../entities/entry/model/entryState';
import type { EntryUsage } from '../../../entities/entry/model/entry.types';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import { resolveSessionTitle } from '../../../shared/utils/sessionTitle';

export interface CompletedFinishedSessionWordItem {
  text: string;
  translation: string;
  usage: EntryUsage;
}

export interface PendingFinishedSessionWordItem {
  text: string;
}

export interface FailedFinishedSessionWordItem {
  text: string;
}

export type GetFinishedSessionWordsResult =
  | { kind: 'missing' }
  | {
      kind: 'empty';
      title: string;
    }
  | {
      completedItems: CompletedFinishedSessionWordItem[];
      failedItems: FailedFinishedSessionWordItem[];
      kind: 'ready';
      pendingItems: PendingFinishedSessionWordItem[];
      title: string;
    };

export class GetFinishedSessionWordsUseCase {
  private readonly sessionRepository: SessionRepository;
  private readonly entryRepository: EntryRepository;

  constructor(
    sessionRepository: SessionRepository,
    entryRepository: EntryRepository,
  ) {
    this.sessionRepository = sessionRepository;
    this.entryRepository = entryRepository;
  }

  async execute(
    userId: number,
    sessionId: string,
  ): Promise<GetFinishedSessionWordsResult> {
    const session = await this.sessionRepository.findFinishedSessionById(
      userId,
      sessionId,
    );

    if (!session) {
      return {
        kind: 'missing',
      };
    }

    const entries = await this.entryRepository.findBySessionId(session.id);
    const title = resolveSessionTitle(session);

    if (entries.length === 0) {
      return {
        kind: 'empty',
        title,
      };
    }

    return {
      completedItems: entries.filter(isCompletedEntry).map((entry) => ({
        text: entry.text,
        translation: entry.translation,
        usage: entry.usage,
      })),
      failedItems: entries
        .filter((entry) => entry.status === 'failed')
        .map((entry) => ({
          text: entry.text,
        })),
      kind: 'ready',
      pendingItems: entries
        .filter((entry) => entry.status === 'pending')
        .map((entry) => ({
          text: entry.text,
        })),
      title,
    };
  }
}
