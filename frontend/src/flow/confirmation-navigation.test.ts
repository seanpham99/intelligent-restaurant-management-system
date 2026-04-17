import assert from 'node:assert/strict';
import test from 'node:test';
import { canLeaveConfirmation } from './confirmation-navigation';

test('blocks leaving confirmation while submit is in progress', () => {
  assert.equal(canLeaveConfirmation(true), false);
});

test('allows leaving confirmation when submit is idle', () => {
  assert.equal(canLeaveConfirmation(false), true);
});
