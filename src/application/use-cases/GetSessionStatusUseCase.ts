import type { EntryRepository } from '../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../entities/session/api/sessionRepository';
import type { EntryStatusSummary } from '../../features/session-status/model/summarizeEntries';
import { summarizeEntries } from '../../features/session-status/model/summarizeEntries';

export type SessionStatusResult =
  | { kind: 'noActive' }
  | ({ kind: 'active' } & EntryStatusSummary);

export class GetSessionStatusUseCase {
  private readonly sessionRepository: SessionRepository;
  private readonly entryRepository: EntryRepository;

  constructor(
    sessionRepository: SessionRepository,
    entryRepository: EntryRepository,
  ) {
    this.sessionRepository = sessionRepository;
    this.entryRepository = entryRepository;
  }

  execute(userId: number): SessionStatusResult {
    const session = this.sessionRepository.getActiveSession(userId);

    if (!session) {
      return { kind: 'noActive' };
    }

    const entries = this.entryRepository.findBySessionId(session.id);

    return {
      kind: 'active',
      ...summarizeEntries(entries),
    };
  }
}
