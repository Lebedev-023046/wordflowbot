import assert from 'node:assert/strict';
import test from 'node:test';
import { messages } from '../../../src/shared/i18n/messages';

test('finish session messages are user-friendly', () => {
  assert.equal(
    messages.session.stopConfirm,
    'Finish this session?\nExport what you need before finishing.',
  );
  assert.equal(messages.session.stopCancelled, 'Your session stays active.');
  assert.equal(
    messages.session.stopped,
    '🏁 Session finished. Start a new one anytime.',
  );
});
