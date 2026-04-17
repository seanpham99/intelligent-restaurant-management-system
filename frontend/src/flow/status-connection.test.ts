import assert from 'node:assert/strict';
import test from 'node:test';
import { canRetryStatusStream, nextRetryDelayMs } from './status-connection';

test('nextRetryDelayMs applies bounded exponential backoff', () => {
  assert.equal(nextRetryDelayMs(0), 500);
  assert.equal(nextRetryDelayMs(1), 1000);
  assert.equal(nextRetryDelayMs(5), 8000);
});

test('canRetryStatusStream enforces retry cap', () => {
  assert.equal(canRetryStatusStream(4), true);
  assert.equal(canRetryStatusStream(5), false);
});
