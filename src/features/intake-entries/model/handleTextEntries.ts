import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import { EntryFactory } from '../../../application/services/EntryFactory';
import { EntryParser } from '../../../application/services/EntryParser';
import {
  IntakeEntriesUseCase,
  type IntakeEntriesResult as HandleTextEntriesResult,
} from '../../../application/use-cases/IntakeEntriesUseCase';

interface HandleTextEntriesParams {
  entryRepository: EntryRepository;
  sessionId: string;
  text: string;
}

export type { HandleTextEntriesResult };

export function handleTextEntries({
  entryRepository,
  sessionId,
  text,
}: HandleTextEntriesParams): Promise<HandleTextEntriesResult> {
  return new IntakeEntriesUseCase(
    entryRepository,
    new EntryParser(),
    new EntryFactory(),
  ).execute({
    sessionId,
    text,
  });
}
