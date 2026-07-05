import type { PrismaClient } from '@prisma/client';
import type {
  UserSettings,
  UserSettingsRepository,
} from '../../../application/ports/UserSettingsRepository';

export class PrismaUserSettingsRepository implements UserSettingsRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async get(userId: number): Promise<UserSettings | null> {
    const record = await this.prisma.userSettings.findUnique({
      where: { userId: BigInt(userId) },
    });

    if (!record) {
      return null;
    }

    return {
      studyLanguage: record.studyLanguage,
      translationLanguage: record.translationLanguage,
    };
  }

  async save(userId: number, settings: UserSettings): Promise<void> {
    await this.prisma.userSettings.upsert({
      create: {
        studyLanguage: settings.studyLanguage,
        translationLanguage: settings.translationLanguage,
        userId: BigInt(userId),
      },
      update: {
        studyLanguage: settings.studyLanguage,
        translationLanguage: settings.translationLanguage,
      },
      where: { userId: BigInt(userId) },
    });
  }
}
