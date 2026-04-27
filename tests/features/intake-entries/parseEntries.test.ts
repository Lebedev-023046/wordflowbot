import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEntries } from '../../../src/features/intake-entries/model/parseEntries';

test('parseEntries trims lines and removes empty ones', () => {
  const result = parseEntries(' hassle \n\npull through\n   \n baffled ');

  assert.deepEqual(result, ['hassle', 'pull through', 'baffled']);
});

test('parseEntries deduplicates case-insensitively and keeps first value', () => {
  const result = parseEntries('Hassle\nhassle\n  HASSLE  \nPull through');

  assert.deepEqual(result, ['Hassle', 'Pull through']);
});
