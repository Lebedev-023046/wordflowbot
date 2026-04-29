import assert from 'node:assert/strict';
import test from 'node:test';
import { messages } from '../../../src/shared/i18n/messages';

test('clear session messages are user-friendly', () => {
  assert.equal(
    messages.session.clearConfirm,
    'Clear all words from this session? The session will stay active.',
  );
  assert.equal(
    messages.session.cleared(2),
    '🧹 Cleared 2 items from the current session. The session is still active.',
  );
  assert.equal(
    messages.session.clearCancelled,
    'Your words stay in the current session.',
  );
});
