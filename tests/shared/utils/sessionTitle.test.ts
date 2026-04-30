import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDefaultSessionTitle,
  formatSessionEndDate,
} from '../../../src/shared/utils/sessionTitle';

test('buildDefaultSessionTitle includes local date and time to the minute', () => {
  const value = new Date(2026, 3, 30, 18, 45);

  assert.equal(buildDefaultSessionTitle(value), 'session-2026-04-30-18-45');
});

test('formatSessionEndDate renders local date and time for history rows', () => {
  const value = new Date(2026, 3, 30, 18, 45);

  assert.equal(formatSessionEndDate(value), '2026-04-30 18:45');
});
