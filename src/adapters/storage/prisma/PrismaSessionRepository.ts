import type { PrismaClient } from '@prisma/client';
import type {
  Session,
  SessionRepository,
} from '../../../entities/session/api/sessionRepository';
import { mapSessionToDomain } from './mappers';

export class PrismaSessionRepository implements SessionRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async clearSession(userId: number): Promise<void> {
    await this.prisma.session.deleteMany({
      where: {
        endedAt: null,
        userId: BigInt(userId),
      },
    });
  }

  async findFinishedSessions(userId: number): Promise<Session[]> {
    const sessions = await this.prisma.session.findMany({
      orderBy: {
        endedAt: 'desc',
      },
      where: {
        endedAt: {
          not: null,
        },
        userId: BigInt(userId),
      },
    });

    return sessions.map(mapSessionToDomain);
  }

  async getActiveSession(userId: number): Promise<Session | null> {
    const session = await this.prisma.session.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
      where: {
        endedAt: null,
        userId: BigInt(userId),
      },
    });

    return session ? mapSessionToDomain(session) : null;
  }

  async hasActiveSession(userId: number): Promise<boolean> {
    return (await this.getActiveSession(userId)) !== null;
  }

  async startSession(userId: number): Promise<Session> {
    const session = await this.prisma.session.create({
      data: {
        id: crypto.randomUUID(),
        userId: BigInt(userId),
      },
    });

    return mapSessionToDomain(session);
  }

  async stopSession(userId: number): Promise<void> {
    await this.prisma.session.updateMany({
      data: {
        endedAt: new Date(),
      },
      where: {
        endedAt: null,
        userId: BigInt(userId),
      },
    });
  }
}
