import type {
  Entry as PrismaEntry,
  EntryExample as PrismaEntryExample,
  Session as PrismaSession,
} from '@prisma/client';
import type {
  Entry,
  EntryUsage,
} from '../../../entities/entry/model/entry.types';
import type { Session } from '../../../entities/session/api/sessionRepository';
import { normalizeEntryText } from '../../../shared/utils/entryText';

type PrismaEntryWithExamples = PrismaEntry & {
  examples: PrismaEntryExample[];
  usage?: EntryUsage | null;
};

export function mapSessionToDomain(session: PrismaSession): Session {
  return {
    createdAt: session.createdAt,
    endedAt: session.endedAt,
    id: session.id,
    isActive: session.endedAt === null,
    title: null,
    userId: Number(session.userId),
  };
}

export function mapEntryToDomain(entry: PrismaEntryWithExamples): Entry {
  const examples = entry.examples
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((example) => ({
      text: example.text,
      translation: example.translation,
    }));

  if (entry.status === 'completed' && entry.translation !== null) {
    return {
      errorMessage: entry.errorMessage,
      examples,
      id: entry.id,
      sessionId: entry.sessionId,
      status: 'completed',
      text: entry.text,
      translation: entry.translation,
      usage: entry.usage ?? 'B',
    };
  }

  if (entry.status === 'failed') {
    return {
      errorMessage: entry.errorMessage,
      examples,
      id: entry.id,
      sessionId: entry.sessionId,
      status: 'failed',
      text: entry.text,
      translation: entry.translation,
      usage: null,
    };
  }

  return {
    errorMessage: entry.errorMessage,
    examples,
    id: entry.id,
    sessionId: entry.sessionId,
    status: 'pending',
    text: entry.text,
    translation: null,
    usage: null,
  };
}

export function buildEntryPersistencePayload(entry: Entry) {
  return {
    errorMessage: entry.errorMessage,
    normalizedText: normalizeEntryText(entry.text),
    status: entry.status,
    text: entry.text,
    translation: entry.translation,
    usage: entry.usage,
  };
}
