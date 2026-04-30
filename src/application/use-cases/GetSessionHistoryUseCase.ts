import type { EntryRepository } from '../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../entities/session/api/sessionRepository';
import {
  formatSessionEndDate,
  resolveSessionTitle,
} from '../../shared/utils/sessionTitle';

export interface SessionHistoryItem {
  completedWords: number;
  endedAtLabel: string;
  title: string;
}

export type GetSessionHistoryResult =
  | { kind: 'empty' }
  | {
      items: SessionHistoryItem[];
      kind: 'ready';
    };

export class GetSessionHistoryUseCase {
  private readonly sessionRepository: SessionRepository;
  private readonly entryRepository: EntryRepository;

  constructor(
    sessionRepository: SessionRepository,
    entryRepository: EntryRepository,
  ) {
    this.sessionRepository = sessionRepository;
    this.entryRepository = entryRepository;
  }

  async execute(userId: number): Promise<GetSessionHistoryResult> {
    const sessions = await this.sessionRepository.findFinishedSessions(userId);

    if (sessions.length === 0) {
      return {
        kind: 'empty',
      };
    }

    const completedEntries = await this.entryRepository.findCompletedBySessionIds(
      sessions.map((session) => session.id),
    );
    const completedWordsBySessionId = new Map<string, number>();

    for (const entry of completedEntries) {
      completedWordsBySessionId.set(
        entry.sessionId,
        (completedWordsBySessionId.get(entry.sessionId) ?? 0) + 1,
      );
    }

    return {
      items: sessions.map((session) => ({
        completedWords: completedWordsBySessionId.get(session.id) ?? 0,
        endedAtLabel: formatSessionEndDate(session.endedAt ?? session.createdAt),
        title: resolveSessionTitle(session),
      })),
      kind: 'ready',
    };
  }
}
