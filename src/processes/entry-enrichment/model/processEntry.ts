import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { Entry, EntryEnrichment } from '../../../entities/entry/model/entry.types';

export type ProcessEntryResult =
  | {
      kind: 'failed';
      text: string;
    }
  | {
      kind: 'succeeded';
      text: string;
      translation: string;
    };

function buildStubEnrichment(entry: Entry): EntryEnrichment {
  return {
    translation: `translation for ${entry.text}`,
    examples: [
      {
        text: `This is an example with ${entry.text}.`,
        translation: `Это пример с ${entry.text}.`,
      },
      {
        text: `Another example uses ${entry.text} in context.`,
        translation: `Другой пример использует ${entry.text} в контексте.`,
      },
    ],
  };
}

export async function processEntry(
  entry: Entry,
  entryRepository: EntryRepository,
): Promise<ProcessEntryResult> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const enrichment = buildStubEnrichment(entry);
    entryRepository.updateEnrichment(entry.id, enrichment);
    entryRepository.updateStatus(entry.id, 'completed');

    return {
      kind: 'succeeded',
      text: entry.text,
      translation: enrichment.translation,
    };
  } catch {
    entryRepository.updateError(entry.id, 'Entry enrichment failed.');
    entryRepository.updateStatus(entry.id, 'failed');

    return {
      kind: 'failed',
      text: entry.text,
    };
  }
}
