import test from 'node:test';
import assert from 'node:assert/strict';
import { EntryParser } from '../../../src/application/services/EntryParser';

const parser = new EntryParser();

test('parseEntries trims lines and removes empty ones', () => {
  const result = parser.parse(' hassle \n\npull through\n   \n baffled ');

  assert.deepEqual(result, ['hassle', 'pull through', 'baffled']);
});

test('parseEntries deduplicates case-insensitively and keeps first value', () => {
  const result = parser.parse('Hassle\nhassle\n  HASSLE  \nPull through');

  assert.deepEqual(result, ['Hassle', 'Pull through']);
});

test('parseEntries supports bullet lists and numbered lists', () => {
  const result = parser.parse(
    '- hassle\n* pull through\n1. baffled\n2) on the other hand',
  );

  assert.deepEqual(result, [
    'hassle',
    'pull through',
    'baffled',
    'on the other hand',
  ]);
});

test('parseEntries supports semicolon-separated items on a single line', () => {
  const result = parser.parse('hassle; pull through; on the other hand');

  assert.deepEqual(result, ['hassle', 'pull through', 'on the other hand']);
});

test('parseEntries does not split a single line by commas', () => {
  const result = parser.parse('on the other hand, to be honest');

  assert.deepEqual(result, ['on the other hand, to be honest']);
});
