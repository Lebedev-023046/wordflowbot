import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { RenameSessionUseCase } from '../../../src/application/session/commands/RenameSessionUseCase';

test('RenameSessionUseCase persists a trimmed custom session title', async () => {
  const sessions = new InMemorySessionRepository();
  const session = await sessions.startSession(1);
  await sessions.stopSession(1);

  const result = await new RenameSessionUseCase(sessions).execute(
    1,
    session.id,
    '  Product meeting  ',
  );

  assert.deepEqual(result, {
    kind: 'renamed',
    title: 'Product meeting',
  });
  assert.equal(
    (await sessions.findFinishedSessionById(1, session.id))?.title,
    'Product meeting',
  );
});

test('RenameSessionUseCase rejects an empty title', async () => {
  const sessions = new InMemorySessionRepository();
  const session = await sessions.startSession(1);
  await sessions.stopSession(1);

  const result = await new RenameSessionUseCase(sessions).execute(
    1,
    session.id,
    '   ',
  );

  assert.deepEqual(result, {
    kind: 'emptyTitle',
  });
});
