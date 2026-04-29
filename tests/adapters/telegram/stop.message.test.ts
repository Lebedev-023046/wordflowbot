import assert from 'node:assert/strict';
import test from 'node:test';
import { messages } from '../../../src/shared/i18n/messages';

test('finish session messages are user-friendly', () => {
  assert.equal(
    messages.session.stopConfirm,
    'Finish this session? This closes the current session. If you want to show or export these words in the bot, do that before finishing.',
  );
  assert.equal(messages.session.stopCancelled, 'Your session stays active.');
  assert.equal(
    messages.session.stopped,
    '🏁 Session finished. Start a new session when you want to add more words.',
  );
});
