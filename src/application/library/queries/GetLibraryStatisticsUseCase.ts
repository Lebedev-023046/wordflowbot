import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';

export interface GetLibraryStatisticsResult {
  activeSession: boolean;
  finishedSessions: number;
  totalWords: number;
  usageA: number;
  usageB: number;
  usageC: number;
}

export class GetLibraryStatisticsUseCase {
  private readonly sessionRepository: SessionRepository;
  private readonly entryRepository: EntryRepository;

  constructor(
    sessionRepository: SessionRepository,
    entryRepository: EntryRepository,
  ) {
    this.sessionRepository = sessionRepository;
    this.entryRepository = entryRepository;
  }

  async execute(userId: number): Promise<GetLibraryStatisticsResult> {
    const [activeSession, finishedSessions] = await Promise.all([
      this.sessionRepository.getActiveSession(userId),
      this.sessionRepository.findFinishedSessions(userId),
    ]);
    const completedEntries =
      await this.entryRepository.findCompletedBySessionIds(
        finishedSessions.map((session) => session.id),
      );

    return {
      activeSession: activeSession !== null,
      finishedSessions: finishedSessions.length,
      totalWords: completedEntries.length,
      usageA: completedEntries.filter((entry) => entry.usage === 'A').length,
      usageB: completedEntries.filter((entry) => entry.usage === 'B').length,
      usageC: completedEntries.filter((entry) => entry.usage === 'C').length,
    };
  }
}
