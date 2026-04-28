import type { EntryRepository } from '../../entities/entry/api/entryRepository';
import type { Entry } from '../../entities/entry/model/entry.types';
import { isUniqueConstraintError } from '../../shared/utils/errors';
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

  async execute({
    sessionId,
    text,
  }: IntakeEntriesCommand): Promise<IntakeEntriesResult> {
    const parsedEntries = this.entryParser.parse(text);

    if (parsedEntries.length === 0) {
      return { kind: 'empty' };
    }

    const uniqueTexts: string[] = [];

    for (const entryText of parsedEntries) {
      if (!(await this.entryRepository.existsInSession(sessionId, entryText))) {
        uniqueTexts.push(entryText);
      }
    }

    if (uniqueTexts.length === 0) {
      return { kind: 'duplicatesOnly' };
    }

    const entries = uniqueTexts.map((entryText) =>
      this.entryFactory.createPending(sessionId, entryText),
    );

    const savedEntries = await this.saveEntries(entries);

    if (savedEntries.length === 0) {
      return { kind: 'duplicatesOnly' };
    }

    return {
      count: savedEntries.length,
      entries: savedEntries,
      kind: 'saved',
    };
  }

  private async saveEntries(entries: Entry[]): Promise<Entry[]> {
    try {
      await this.entryRepository.saveMany(entries);
      return entries;
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
    }

    const savedEntries: Entry[] = [];

    for (const entry of entries) {
      try {
        await this.entryRepository.save(entry);
        savedEntries.push(entry);
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          continue;
        }

        throw error;
      }
    }

    return savedEntries;
  }
}
