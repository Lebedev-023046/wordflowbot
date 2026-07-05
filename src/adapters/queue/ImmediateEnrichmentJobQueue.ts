import type { EnrichmentJobQueue } from '../../application/ports/EnrichmentJobQueue';
import type { EnrichEntriesUseCase } from '../../application/entries/commands/EnrichEntriesUseCase';
import type { EnrichmentContext } from '../../entities/entry/api/entryEnrichmentClient';
import type { Entry } from '../../entities/entry/model/entry.types';

export class ImmediateEnrichmentJobQueue implements EnrichmentJobQueue {
  private readonly enrichEntriesUseCase: EnrichEntriesUseCase;

  constructor(enrichEntriesUseCase: EnrichEntriesUseCase) {
    this.enrichEntriesUseCase = enrichEntriesUseCase;
  }

  enqueue(entries: Entry[], context: EnrichmentContext) {
    return this.enrichEntriesUseCase.execute(entries, context);
  }
}
