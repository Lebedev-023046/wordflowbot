import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { Entry } from '../../../entities/entry/model/entry.types';

export async function processEntry(
  entry: Entry,
  entryRepository: EntryRepository,
): Promise<void> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));
    entryRepository.updateStatus(entry.id, 'completed');
  } catch {
    entryRepository.updateStatus(entry.id, 'failed');
  }
}
