import assert from 'node:assert/strict';
import test from 'node:test';
import { registerTextMessageHandler } from '../../../src/adapters/telegram/handlers/textMessage.handler';
import { InMemoryEntryRepository } from '../../../src/adapters/storage/in-memory/InMemoryEntryRepository';
import { InMemorySessionRepository } from '../../../src/adapters/storage/in-memory/InMemorySessionRepository';
import { PendingSessionRenameStore } from '../../../src/adapters/telegram/lib/pendingSessionRenameState';
import { GetFinishedSessionWordsUseCase } from '../../../src/application/library/queries/GetFinishedSessionWordsUseCase';
import type { EnrichmentJobQueue } from '../../../src/application/ports/EnrichmentJobQueue';
import { RenameSessionUseCase } from '../../../src/application/session/commands/RenameSessionUseCase';
import { EntryFactory } from '../../../src/application/services/EntryFactory';
import { completeEntry } from '../../../src/entities/entry/model/entryState';

type TextHandler = (ctx: FakeContext) => Promise<unknown>;

class FakeBot {
  textHandler: TextHandler | null = null;

  on(_filter: unknown, handler: TextHandler) {
    this.textHandler = handler;
    return this;
  }
}

class FakeContext {
  message: {
    reply_to_message?: {
      message_id: number;
    };
    text: string;
  };
  replyCalls: Array<{
    extra?: object;
    text: string;
  }> = [];
  from = { id: 1 };

  constructor(text: string, replyToMessageId?: number) {
    this.message = {
      ...(replyToMessageId
        ? {
            reply_to_message: {
              message_id: replyToMessageId,
            },
          }
        : {}),
      text,
    };
  }

  async reply(text: string, extra?: object) {
    this.replyCalls.push({ extra, text });
    return { message_id: this.replyCalls.length };
  }
}

test('text message handler applies a pending session rename reply instead of intake', async () => {
  const bot = new FakeBot();
  const entries = new InMemoryEntryRepository();
  const sessions = new InMemorySessionRepository();
  const renameState = new PendingSessionRenameStore();
  const session = await sessions.startSession(1);
  const entryFactory = new EntryFactory();
  await entries.save(
    completeEntry(entryFactory.createPending(session.id, 'inflation'), {
      examples: [],
      translation: 'translation for inflation',
      usage: 'A',
    }),
  );
  await sessions.stopSession(1);

  renameState.set(1, {
    historyPage: 0,
    promptMessageId: 42,
    sessionId: session.id,
    source: 'history',
  });

  const enrichmentQueue: EnrichmentJobQueue = {
    async enqueue() {
      throw new Error('enqueue should not run during rename');
    },
  };

  registerTextMessageHandler(
    bot as unknown as never,
    entries,
    sessions,
    {
      async execute() {
        throw new Error('intake should not run during rename');
      },
    } as never,
    enrichmentQueue,
    new GetFinishedSessionWordsUseCase(sessions, entries),
    new RenameSessionUseCase(sessions),
    renameState,
  );

  assert.ok(bot.textHandler);

  const ctx = new FakeContext('BBC article about inflation', 42);
  await bot.textHandler?.(ctx);

  assert.equal(
    (await sessions.findFinishedSessionById(1, session.id))?.title,
    'BBC article about inflation',
  );
  assert.equal(renameState.get(1), null);
  assert.match(
    ctx.replyCalls[0]?.text ?? '',
    /^BBC article about inflation\n\nAll\n1\. inflation - translation for inflation$/,
  );
});
