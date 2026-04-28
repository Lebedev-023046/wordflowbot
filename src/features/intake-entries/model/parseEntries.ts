import { EntryParser } from '../../../application/services/EntryParser';

export function parseEntries(text: string): string[] {
  return new EntryParser().parse(text);
}
