import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import { markEntryPending } from '../../../entities/entry/model/entryState';
import type { SessionRepository } from '../../../entities/session/api/sessionRepository';
import type { ProcessEntriesResult } from '../../../processes/entry-enrichment/model/process-entry.types';
import type { EnrichmentJobQueue } from '../../ports/EnrichmentJobQueue';
import type { LanguageLevelRepository } from '../../ports/LanguageLevelRepository';
import { resolveEnrichmentContext } from '../../services/resolveEnrichmentContext';

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
  private readonly languageLevelRepository: LanguageLevelRepository;

  constructor(
    sessionRepository: SessionRepository,
    entryRepository: EntryRepository,
    enrichmentJobQueue: EnrichmentJobQueue,
    languageLevelRepository: LanguageLevelRepository,
  ) {
    this.sessionRepository = sessionRepository;
    this.entryRepository = entryRepository;
    this.enrichmentJobQueue = enrichmentJobQueue;
    this.languageLevelRepository = languageLevelRepository;
  }

  async execute(userId: number): Promise<RetryFailedEntriesResult> {
    const session = await this.sessionRepository.getActiveSession(userId);

    if (!session) {
      return { kind: 'noActive' };
    }

    const failedEntries = (
      await this.entryRepository.findBySessionId(session.id)
    ).filter((entry) => entry.status === 'failed');

    if (failedEntries.length === 0) {
      return { kind: 'noFailed' };
    }

    const retriedEntries = failedEntries.map((entry) =>
      markEntryPending(entry),
    );

    for (const entry of retriedEntries) {
      await this.entryRepository.update(entry);
    }

    const context = await resolveEnrichmentContext(
      this.languageLevelRepository,
      session,
    );
    const processingResult = await this.enrichmentJobQueue.enqueue(
      retriedEntries,
      context,
    );

    return {
      kind: 'retried',
      processingResult,
      retryCount: retriedEntries.length,
    };
  }
}
