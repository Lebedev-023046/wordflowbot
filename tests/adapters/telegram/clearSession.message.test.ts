import assert from 'node:assert/strict';
import test from 'node:test';
import { messages } from '../../../src/shared/i18n/messages';

test('clear session messages are user-friendly', () => {
  assert.equal(
    messages.session.clearConfirm,
    'Clear this session? This will remove all words from the current session.',
  );
  assert.equal(
    messages.session.cleared(2),
    'Session cleared. Removed 2 items from this session.',
  );
  assert.equal(messages.session.clearCancelled, 'Your session was not cleared.');
});
