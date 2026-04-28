import type { EntryEnrichmentClient } from '../../entities/entry/api/entryEnrichmentClient';
import type { EntryRepository } from '../../entities/entry/api/entryRepository';
import type { Entry } from '../../entities/entry/model/entry.types';
import {
  completeEntry,
  failEntry,
} from '../../entities/entry/model/entryState';
import { getEntryFailureKind } from '../../processes/entry-enrichment/model/getEntryFailureKind';
import type {
  EntryFailureKind,
  ProcessEntriesResult,
  ProcessEntryResult,
} from '../../processes/entry-enrichment/model/process-entry.types';
import type { Logger } from '../../shared/logging/logger';
import { getErrorDetails, getErrorMessage } from '../../shared/utils/errors';

export class ProcessEntriesUseCase {
  private readonly concurrency: number;
  private readonly entryEnrichmentClient: EntryEnrichmentClient;
  private readonly entryRepository: EntryRepository;
  private readonly logger: Logger;

  constructor(
    entryEnrichmentClient: EntryEnrichmentClient,
    entryRepository: EntryRepository,
    logger: Logger,
    concurrency = Infinity,
  ) {
    this.concurrency = concurrency;
    this.entryEnrichmentClient = entryEnrichmentClient;
    this.entryRepository = entryRepository;
    this.logger = logger;
  }

  async execute(entries: Entry[]): Promise<ProcessEntriesResult> {
    const results = await mapWithConcurrency(
      entries,
      this.concurrency,
      (entry) => this.processEntry(entry),
    );

    return results.reduce<ProcessEntriesResult>(
      (accumulator, result) => {
        if (result.kind === 'failed') {
          accumulator.failedCount += 1;
          accumulator.failureKinds.push(result.failureKind);
          return accumulator;
        }

        accumulator.succeeded.push({
          text: result.text,
          translation: result.translation,
        });

        return accumulator;
      },
      {
        failedCount: 0,
        failureKinds: [],
        succeeded: [],
      },
    );
  }

  private async processEntry(entry: Entry): Promise<ProcessEntryResult> {
    try {
      const enrichment = await this.entryEnrichmentClient.enrich(entry.text);
      await this.entryRepository.update(completeEntry(entry, enrichment));

      return {
        kind: 'succeeded',
        text: entry.text,
        translation: enrichment.translation,
      };
    } catch (error) {
      const failureKind = getEntryFailureKind(error);
      const errorMessage = getErrorMessage(error, 'Entry enrichment failed.');
      const userFacingMessage = this.getUserFacingFailureMessage(failureKind);

      this.logger.error('Entry enrichment failed.', {
        entryId: entry.id,
        error: getErrorDetails(error),
        errorMessage,
        failureKind,
        text: entry.text,
      });

      await this.entryRepository.update(failEntry(entry, userFacingMessage));

      return {
        kind: 'failed',
        failureKind,
        text: entry.text,
      };
    }
  }

  private getUserFacingFailureMessage(failureKind: EntryFailureKind): string {
    if (failureKind === 'insufficient_quota') {
      return 'Could not finish this item right now. Please try again later.';
    }

    return 'Something went wrong while preparing this item. Please try again.';
  }
}

async function mapWithConcurrency<Input, Output>(
  items: Input[],
  concurrency: number,
  mapper: (item: Input) => Promise<Output>,
): Promise<Output[]> {
  if (items.length === 0) {
    return [];
  }

  const limit = Math.min(Math.max(1, concurrency), items.length);
  const results = new Array<Output>(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: limit }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  });

  await Promise.all(workers);

  return results;
}
