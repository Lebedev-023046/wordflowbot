import type { LanguageLevelRepository } from '../../../application/ports/LanguageLevelRepository';

const DEFAULT_LEVEL = 'B2';

export class InMemoryLanguageLevelRepository implements LanguageLevelRepository {
  private readonly levelsByKey = new Map<string, string>();

  async getLevel(userId: number, language: string): Promise<string> {
    return this.levelsByKey.get(this.getKey(userId, language)) ?? DEFAULT_LEVEL;
  }

  async setLevel(
    userId: number,
    language: string,
    level: string,
  ): Promise<void> {
    this.levelsByKey.set(this.getKey(userId, language), level);
  }

  private getKey(userId: number, language: string): string {
    return `${userId}:${language}`;
  }
}
