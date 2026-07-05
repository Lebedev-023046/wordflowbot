import type { PrismaClient } from '@prisma/client';
import type {
  Session,
  SessionRepository,
} from '../../../entities/session/api/sessionRepository';

interface SessionRecord {
  createdAt: Date;
  endedAt: Date | null;
  id: string;
  title?: string | null;
  studyLanguage?: string;
  translationLanguage?: string;
  userId: bigint;
}

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

  async findFinishedSessionById(
    userId: number,
    sessionId: string,
  ): Promise<Session | null> {
    const session = await this.prisma.session.findFirst({
      where: {
        endedAt: {
          not: null,
        },
        id: sessionId,
        userId: BigInt(userId),
      },
    });

    return session ? mapSessionRecordToDomain(session) : null;
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

    return sessions.map(mapSessionRecordToDomain);
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

    return session ? mapSessionRecordToDomain(session) : null;
  }

  async hasActiveSession(userId: number): Promise<boolean> {
    return (await this.getActiveSession(userId)) !== null;
  }

  async renameSession(
    userId: number,
    sessionId: string,
    title: string,
  ): Promise<Session | null> {
    const session = await this.findFinishedSessionById(userId, sessionId);

    if (!session) {
      return null;
    }

    if (!this.supportsSessionTitle()) {
      return null;
    }

    const updatedSession = await this.prisma.session.update({
      data: {
        title,
      },
      where: {
        id: sessionId,
      },
    });

    return mapSessionRecordToDomain(updatedSession);
  }

  async startSession(
    userId: number,
    studyLanguage: string,
    translationLanguage: string,
  ): Promise<Session> {
    const session = await this.prisma.session.create({
      data: {
        id: crypto.randomUUID(),
        studyLanguage,
        translationLanguage,
        userId: BigInt(userId),
      },
    });

    return mapSessionRecordToDomain(session);
  }

  async stopSession(userId: number): Promise<Session | null> {
    const session = await this.getActiveSession(userId);

    if (!session) {
      return null;
    }

    const updatedSession = await this.prisma.session.update({
      data: {
        endedAt: new Date(),
      },
      where: {
        id: session.id,
      },
    });

    return mapSessionRecordToDomain(updatedSession);
  }

  private supportsSessionTitle(): boolean {
    const runtimeDataModel = (
      this.prisma as PrismaClient & {
        _runtimeDataModel?: {
          models?: Record<
            string,
            {
              fields?: Array<{
                name?: string;
              }>;
            }
          >;
        };
      }
    )._runtimeDataModel;

    const sessionFields = runtimeDataModel?.models?.Session?.fields ?? [];

    return sessionFields.some((field) => field.name === 'title');
  }
}

function mapSessionRecordToDomain(record: SessionRecord): Session {
  return {
    createdAt: record.createdAt,
    endedAt: record.endedAt,
    id: record.id,
    isActive: record.endedAt === null,
    title: record.title ?? null,
    studyLanguage: record.studyLanguage ?? 'en',
    translationLanguage: record.translationLanguage ?? 'ru',
    userId: Number(record.userId),
  };
}
