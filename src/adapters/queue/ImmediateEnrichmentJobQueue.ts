import type { EnrichmentJobQueue } from '../../application/ports/EnrichmentJobQueue';
import type { ProcessEntriesUseCase } from '../../application/use-cases/ProcessEntriesUseCase';
import type { Entry } from '../../entities/entry/model/entry.types';

export class ImmediateEnrichmentJobQueue implements EnrichmentJobQueue {
  private readonly processEntriesUseCase: ProcessEntriesUseCase;

  constructor(processEntriesUseCase: ProcessEntriesUseCase) {
    this.processEntriesUseCase = processEntriesUseCase;
  }

  enqueue(entries: Entry[]) {
    return this.processEntriesUseCase.execute(entries);
  }
}
