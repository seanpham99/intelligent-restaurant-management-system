import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCartFingerprint,
  canSubmitCart,
  isDuplicatePendingSubmission,
} from './order-guards';

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

test('detects duplicate pending submission with deterministic fingerprint', () => {
  const cart = [
    { id: 'item-b', quantity: 1 },
    { id: 'item-a', quantity: 2 },
  ];
  const reorderedCart = [
    { id: 'item-a', quantity: 2 },
    { id: 'item-b', quantity: 1 },
  ];

  const fingerprint = buildCartFingerprint(cart);
  const reorderedFingerprint = buildCartFingerprint(reorderedCart);

  assert.equal(fingerprint, 'item-a:2|item-b:1');
  assert.equal(reorderedFingerprint, fingerprint);

  const pending = new Set([fingerprint]);
  assert.equal(isDuplicatePendingSubmission(reorderedFingerprint, pending), true);
});
