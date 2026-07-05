import type {
  UserSettings,
  UserSettingsRepository,
} from '../../../application/ports/UserSettingsRepository';

export class InMemoryUserSettingsRepository implements UserSettingsRepository {
  private readonly settingsByUserId = new Map<number, UserSettings>();

  async get(userId: number): Promise<UserSettings | null> {
    return this.settingsByUserId.get(userId) ?? null;
  }

  async save(userId: number, settings: UserSettings): Promise<void> {
    this.settingsByUserId.set(userId, { ...settings });
  }
}
