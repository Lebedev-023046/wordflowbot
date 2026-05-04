import assert from 'node:assert/strict';
import test from 'node:test';
import { messages } from '../../../src/shared/i18n/messages';

test('finish session messages are user-friendly', () => {
  assert.equal(
    messages.session.stopConfirm,
    'Finish this session?\nYou can reopen it anytime in Past sessions.',
  );
  assert.equal(messages.session.stopCancelled, 'Your session stays active.');
  assert.equal(
    messages.session.stopped,
    [
      'Session finished.',
      '',
      'Find it anytime in Past sessions.',
      'You can open it, rename it, or export it later.',
    ].join('\n'),
  );
});
