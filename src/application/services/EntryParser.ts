import { normalizeEntryText } from '../../shared/utils/entryText';

export class EntryParser {
  parse(text: string): string[] {
    const uniqueEntries = new Map<string, string>();
    const rawCandidates = this.getRawCandidates(text);

    for (const candidate of rawCandidates) {
      const trimmedLine = this.normalizeCandidate(candidate);

      if (!trimmedLine) {
        continue;
      }

      const normalizedLine = normalizeEntryText(trimmedLine);

      if (!uniqueEntries.has(normalizedLine)) {
        uniqueEntries.set(normalizedLine, trimmedLine);
      }
    }

    return [...uniqueEntries.values()];
  }

  private getRawCandidates(text: string): string[] {
    const trimmedText = text.trim();

    if (!trimmedText) {
      return [];
    }

    if (!trimmedText.includes('\n') && trimmedText.includes(';')) {
      return trimmedText.split(';');
    }

    return trimmedText.split('\n');
  }

  private normalizeCandidate(candidate: string): string {
    const trimmedCandidate = candidate.trim();

    if (!trimmedCandidate) {
      return '';
    }

    return trimmedCandidate
      .replace(/^[-*•]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .trim();
  }
}
