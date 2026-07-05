export interface LanguageLevelRepository {
  getLevel(userId: number, language: string): Promise<string>;
  setLevel(userId: number, language: string, level: string): Promise<void>;
}
