import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildEntryPersistencePayload,
  mapEntryToDomain,
} from '../../../../src/adapters/storage/prisma/mappers';

test('mapEntryToDomain preserves usage on completed entries and sorts examples', () => {
  const entry = mapEntryToDomain({
    errorMessage: null,
    examples: [
      {
        entryId: 'entry-1',
        id: 'example-2',
        sortOrder: 1,
        text: 'Second example.',
        translation: 'Второй пример.',
      },
      {
        entryId: 'entry-1',
        id: 'example-1',
        sortOrder: 0,
        text: 'First example.',
        translation: 'Первый пример.',
      },
    ],
    id: 'entry-1',
    normalizedText: 'hassle',
    sessionId: 'session-1',
    status: 'completed',
    text: 'hassle',
    translation: 'translation for hassle',
    usage: 'A',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.deepEqual(entry, {
    errorMessage: null,
    examples: [
      {
        text: 'First example.',
        translation: 'Первый пример.',
      },
      {
        text: 'Second example.',
        translation: 'Второй пример.',
      },
    ],
    id: 'entry-1',
    sessionId: 'session-1',
    status: 'completed',
    text: 'hassle',
    translation: 'translation for hassle',
    usage: 'A',
  });
});

test('mapEntryToDomain falls back to usage B for older completed entries', () => {
  const entry = mapEntryToDomain({
    errorMessage: null,
    examples: [],
    id: 'entry-1',
    normalizedText: 'hassle',
    sessionId: 'session-1',
    status: 'completed',
    text: 'hassle',
    translation: 'translation for hassle',
    usage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.equal(entry.status, 'completed');
  assert.equal(entry.usage, 'B');
});

test('buildEntryPersistencePayload includes usage and normalized text', () => {
  assert.deepEqual(
    buildEntryPersistencePayload({
      errorMessage: null,
      examples: [],
      id: 'entry-1',
      sessionId: 'session-1',
      status: 'completed',
      text: '  Hassle  ',
      translation: 'translation for hassle',
      usage: 'C',
    }),
    {
      errorMessage: null,
      normalizedText: 'hassle',
      status: 'completed',
      text: '  Hassle  ',
      translation: 'translation for hassle',
      usage: 'C',
    },
  );
});
