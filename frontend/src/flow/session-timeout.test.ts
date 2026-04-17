import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isSessionExpired,
  shouldApplySessionEpochUpdate,
} from './session-timeout';

test('expires when inactivity exceeds timeout', () => {
  assert.equal(isSessionExpired(0, 310000, 300000), true);
});

test('not expired within window', () => {
  assert.equal(isSessionExpired(0, 299000, 300000), false);
});

test('applies async update when session epoch matches', () => {
  assert.equal(shouldApplySessionEpochUpdate(2, 2), true);
});

test('skips async update when session epoch changed', () => {
  assert.equal(shouldApplySessionEpochUpdate(3, 2), false);
});
