import assert from 'node:assert/strict';
import test from 'node:test';
import { messages } from '../../../src/shared/i18n/messages';

test('finish session messages are user-friendly', () => {
  assert.equal(
    messages.session.stopConfirm,
    'Finish this session? Your saved words will stay intact, but you will need to start a new session to continue.',
  );
  assert.equal(messages.session.stopCancelled, 'Your session stays active.');
  assert.equal(
    messages.session.stopped,
    '✅ Session finished. Your saved words stay intact. Start a new session when you want to continue.',
  );
});
