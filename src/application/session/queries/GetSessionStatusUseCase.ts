import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import type { EntryStatusSummary } from '../../services/EntryStatusSummary';
import { summarizeEntries } from '../../services/EntryStatusSummary';

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

  async execute(userId: number): Promise<SessionStatusResult> {
    const session = await this.sessionRepository.getActiveSession(userId);

    if (!session) {
      return { kind: 'noActive' };
    }

    const entries = await this.entryRepository.findBySessionId(session.id);

    return {
      kind: 'active',
      ...summarizeEntries(entries),
    };
  }
}
