import assert from 'node:assert/strict';
import test from 'node:test';
import { isSessionExpired } from './session-timeout';

test('expires when inactivity exceeds timeout', () => {
  assert.equal(isSessionExpired(0, 310000, 300000), true);
});

test('not expired within window', () => {
  assert.equal(isSessionExpired(0, 299000, 300000), false);
});
