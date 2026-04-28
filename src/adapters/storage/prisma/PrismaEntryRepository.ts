import type { PrismaClient } from '@prisma/client';
import type { EntryRepository } from '../../../entities/entry/api/entryRepository';
import type { Entry } from '../../../entities/entry/model/entry.types';
import { normalizeEntryText } from '../../../shared/utils/entryText';
import { buildEntryPersistencePayload, mapEntryToDomain } from './mappers';

export class PrismaEntryRepository implements EntryRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    await this.prisma.entry.deleteMany({
      where: {
        sessionId,
      },
    });
  }

  async existsInSession(sessionId: string, text: string): Promise<boolean> {
    const entry = await this.prisma.entry.findUnique({
      where: {
        sessionId_normalizedText: {
          normalizedText: normalizeEntryText(text),
          sessionId,
        },
      },
    });

    return entry !== null;
  }

  async findById(entryId: string): Promise<Entry | null> {
    const entry = await this.prisma.entry.findUnique({
      include: {
        examples: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      where: {
        id: entryId,
      },
    });

    return entry ? mapEntryToDomain(entry) : null;
  }

  async findBySessionId(sessionId: string): Promise<Entry[]> {
    const entries = await this.prisma.entry.findMany({
      include: {
        examples: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      where: {
        sessionId,
      },
    });

    return entries.map(mapEntryToDomain);
  }

  async save(entry: Entry): Promise<void> {
    await this.prisma.entry.upsert({
      create: {
        ...buildEntryPersistencePayload(entry),
        id: entry.id,
        sessionId: entry.sessionId,
        examples: {
          create: entry.examples.map((example, index) => ({
            id: crypto.randomUUID(),
            sortOrder: index,
            text: example.text,
            translation: example.translation,
          })),
        },
      },
      update: {
        ...buildEntryPersistencePayload(entry),
        examples: {
          deleteMany: {},
          create: entry.examples.map((example, index) => ({
            id: crypto.randomUUID(),
            sortOrder: index,
            text: example.text,
            translation: example.translation,
          })),
        },
      },
      where: {
        id: entry.id,
      },
    });
  }

  async saveMany(entries: Entry[]): Promise<void> {
    await this.prisma.$transaction(
      entries.map((entry) =>
        this.prisma.entry.create({
          data: {
            ...buildEntryPersistencePayload(entry),
            id: entry.id,
            sessionId: entry.sessionId,
            examples: {
              create: entry.examples.map((example, index) => ({
                id: crypto.randomUUID(),
                sortOrder: index,
                text: example.text,
                translation: example.translation,
              })),
            },
          },
        }),
      ),
    );
  }

  async update(entry: Entry): Promise<void> {
    await this.prisma.entry.update({
      data: {
        ...buildEntryPersistencePayload(entry),
        examples: {
          deleteMany: {},
          create: entry.examples.map((example, index) => ({
            id: crypto.randomUUID(),
            sortOrder: index,
            text: example.text,
            translation: example.translation,
          })),
        },
      },
      where: {
        id: entry.id,
      },
    });
  }
}
