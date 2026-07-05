import type { PrismaClient } from '@prisma/client';
import type { LanguageLevelRepository } from '../../../application/ports/LanguageLevelRepository';

const DEFAULT_LEVEL = 'B2';

export class PrismaLanguageLevelRepository implements LanguageLevelRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getLevel(userId: number, language: string): Promise<string> {
    const record = await this.prisma.languageLevel.findUnique({
      where: {
        userId_language: {
          language,
          userId: BigInt(userId),
        },
      },
    });

    return record?.level ?? DEFAULT_LEVEL;
  }

  async setLevel(
    userId: number,
    language: string,
    level: string,
  ): Promise<void> {
    await this.prisma.languageLevel.upsert({
      create: {
        language,
        level,
        userId: BigInt(userId),
      },
      update: {
        level,
      },
      where: {
        userId_language: {
          language,
          userId: BigInt(userId),
        },
      },
    });
  }
}
