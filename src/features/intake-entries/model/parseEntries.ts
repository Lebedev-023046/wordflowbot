export function parseEntries(text: string): string[] {
  const uniqueEntries = new Map<string, string>();

  for (const line of text.split('\n')) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      continue;
    }

    const normalizedLine = trimmedLine.toLowerCase();

    if (!uniqueEntries.has(normalizedLine)) {
      uniqueEntries.set(normalizedLine, trimmedLine);
    }
  }

  return [...uniqueEntries.values()];
}
