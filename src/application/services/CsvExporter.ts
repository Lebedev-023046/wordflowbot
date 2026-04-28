import type { Entry } from '../../entities/entry/model/entry.types';

export class CsvExporter {
  export(entries: Entry[]): string {
    const rows = entries.map((entry) => {
      const row = [entry.text, entry.translation ?? ''];

      for (const example of entry.examples) {
        row.push(example.text, example.translation);
      }

      return row;
    });

    return rows.map((row) => row.map(this.escapeValue).join(';')).join('\n');
  }

  private escapeValue(value: string): string {
    const normalized = value.replaceAll('"', '""');
    return `"${normalized}"`;
  }
}
