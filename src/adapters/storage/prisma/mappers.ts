import type {
  Entry as PrismaEntry,
  EntryExample as PrismaEntryExample,
  Session as PrismaSession,
} from '@prisma/client';
import type { Entry } from '../../../entities/entry/model/entry.types';
import type { Session } from '../../../entities/session/api/sessionRepository';
import { normalizeEntryText } from '../../../shared/utils/entryText';

type PrismaEntryWithExamples = PrismaEntry & {
  examples: PrismaEntryExample[];
};

export function mapSessionToDomain(session: PrismaSession): Session {
  return {
    id: session.id,
    isActive: session.endedAt === null,
    userId: Number(session.userId),
  };
}

export function mapEntryToDomain(entry: PrismaEntryWithExamples): Entry {
  return {
    errorMessage: entry.errorMessage,
    examples: entry.examples
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((example) => ({
        text: example.text,
        translation: example.translation,
      })),
    id: entry.id,
    sessionId: entry.sessionId,
    status: entry.status,
    text: entry.text,
    translation: entry.translation,
  };
}

export function buildEntryPersistencePayload(entry: Entry) {
  return {
    errorMessage: entry.errorMessage,
    normalizedText: normalizeEntryText(entry.text),
    status: entry.status,
    text: entry.text,
    translation: entry.translation,
  };
}
