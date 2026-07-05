export interface UserSettings {
  studyLanguage: string;
  translationLanguage: string;
}

export interface UserSettingsRepository {
  get(userId: number): Promise<UserSettings | null>;
  save(userId: number, settings: UserSettings): Promise<void>;
}
