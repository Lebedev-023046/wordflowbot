import type { EntryRepository } from '../../entities/entry/api/entryRepository';
import { markEntryPending } from '../../entities/entry/model/entryState';
import type { SessionRepository } from '../../entities/session/api/sessionRepository';
import type { ProcessEntriesResult } from '../../processes/entry-enrichment/model/process-entry.types';
import type { EnrichmentJobQueue } from '../ports/EnrichmentJobQueue';

export type RetryFailedEntriesResult =
  | { kind: 'noActive' }
  | { kind: 'noFailed' }
  | {
      kind: 'retried';
      processingResult: ProcessEntriesResult;
      retryCount: number;
    };

export class RetryFailedEntriesUseCase {
  private readonly sessionRepository: SessionRepository;
  private readonly entryRepository: EntryRepository;
  private readonly enrichmentJobQueue: EnrichmentJobQueue;

  constructor(
    sessionRepository: SessionRepository,
    entryRepository: EntryRepository,
    enrichmentJobQueue: EnrichmentJobQueue,
  ) {
    this.sessionRepository = sessionRepository;
    this.entryRepository = entryRepository;
    this.enrichmentJobQueue = enrichmentJobQueue;
  }

  async execute(userId: number): Promise<RetryFailedEntriesResult> {
    const session = this.sessionRepository.getActiveSession(userId);

    if (!session) {
      return { kind: 'noActive' };
    }

    const failedEntries = this.entryRepository
      .findBySessionId(session.id)
      .filter((entry) => entry.status === 'failed');

    if (failedEntries.length === 0) {
      return { kind: 'noFailed' };
    }

    const retriedEntries = failedEntries.map((entry) =>
      markEntryPending(entry),
    );

    for (const entry of retriedEntries) {
      this.entryRepository.update(entry);
    }

    const processingResult =
      await this.enrichmentJobQueue.enqueue(retriedEntries);

    return {
      kind: 'retried',
      processingResult,
      retryCount: retriedEntries.length,
    };
  }
}
