import assert from 'node:assert/strict';
import test from 'node:test';
import {
  STATUS_STREAM_UNAVAILABLE_MESSAGE,
  canRetryStatusStream,
  nextRetryDelayMs,
  planStatusRetry,
} from './status-connection';

test('nextRetryDelayMs applies bounded exponential backoff', () => {
  assert.equal(nextRetryDelayMs(0), 500);
  assert.equal(nextRetryDelayMs(1), 1000);
  assert.equal(nextRetryDelayMs(5), 8000);
});

test('canRetryStatusStream enforces retry cap', () => {
  assert.equal(canRetryStatusStream(4), true);
  assert.equal(canRetryStatusStream(5), false);
});

test('orchestration schedules bounded retry while attempts remain', () => {
  const result = planStatusRetry(3, 'Live status disconnected. Retry to reconnect.');

  assert.deepEqual(result, {
    shouldSchedule: true,
    delayMs: 4000,
    nextAttempt: 4,
    message: 'Live status disconnected. Retry to reconnect.',
    canRetry: true,
  });
});

test('orchestration does not schedule further retries at cap', () => {
  const result = planStatusRetry(5, 'Live status failed to connect. Please retry.');

  assert.equal(result.shouldSchedule, false);
  assert.equal(result.delayMs, null);
  assert.equal(result.nextAttempt, 5);
  assert.equal(result.canRetry, false);
});

test('orchestration returns terminal message when retries are exhausted', () => {
  const result = planStatusRetry(5, 'Live status disconnected. Retry to reconnect.');

  assert.equal(result.message, STATUS_STREAM_UNAVAILABLE_MESSAGE);
});
