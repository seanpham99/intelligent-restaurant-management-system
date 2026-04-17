import assert from 'node:assert/strict';
import test from 'node:test';
import { canSubmitCart, isDuplicatePendingSubmission } from './order-guards';

test('rejects empty cart', () => {
  const result = canSubmitCart([], []);

  assert.deepEqual(result, { ok: false, reason: 'EMPTY_CART' });
});

test('rejects stale sold-out item', () => {
  const result = canSubmitCart(
    [{ id: 'item-1', quantity: 1 }],
    [{ id: 'item-1', soldOut: true }],
  );

  assert.deepEqual(result, { ok: false, reason: 'STALE_ITEM' });
});

test('detects duplicate pending submission', () => {
  const pending = new Set(['fingerprint-1']);

  assert.equal(isDuplicatePendingSubmission('fingerprint-1', pending), true);
});
