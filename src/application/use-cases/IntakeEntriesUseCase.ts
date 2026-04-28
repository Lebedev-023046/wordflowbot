import type { EntryRepository } from '../../entities/entry/api/entryRepository';
import type { Entry } from '../../entities/entry/model/entry.types';
import { EntryFactory } from '../services/EntryFactory';
import { EntryParser } from '../services/EntryParser';

interface IntakeEntriesCommand {
  sessionId: string;
  text: string;
}

export type IntakeEntriesResult =
  | { kind: 'empty' }
  | { kind: 'duplicatesOnly' }
  | { count: number; entries: Entry[]; kind: 'saved' };

export class IntakeEntriesUseCase {
  private readonly entryRepository: EntryRepository;
  private readonly entryParser: EntryParser;
  private readonly entryFactory: EntryFactory;

  constructor(
    entryRepository: EntryRepository,
    entryParser: EntryParser,
    entryFactory: EntryFactory,
  ) {
    this.entryRepository = entryRepository;
    this.entryParser = entryParser;
    this.entryFactory = entryFactory;
  }

  execute({ sessionId, text }: IntakeEntriesCommand): IntakeEntriesResult {
    const parsedEntries = this.entryParser.parse(text);

    if (parsedEntries.length === 0) {
      return { kind: 'empty' };
    }

    const uniqueTexts = parsedEntries.filter(
      (entryText) => !this.entryRepository.existsInSession(sessionId, entryText),
    );

    if (uniqueTexts.length === 0) {
      return { kind: 'duplicatesOnly' };
    }

    const entries = uniqueTexts.map((entryText) =>
      this.entryFactory.createPending(sessionId, entryText),
    );

    this.entryRepository.saveMany(entries);

    return {
      count: entries.length,
      entries,
      kind: 'saved',
    };
  }
}
