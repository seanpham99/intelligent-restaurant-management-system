import assert from 'node:assert/strict';
import test from 'node:test';
import { canFinalizeSettlement } from './payment-guards';

test('blocks settlement with empty submitted cart', () => {
  const result = canFinalizeSettlement({ submittedItems: 0, paymentSettled: false });

  assert.deepEqual(result, { ok: false, reason: 'EMPTY_ORDER' });
});

test('blocks settlement when already settled', () => {
  const result = canFinalizeSettlement({ submittedItems: 2, paymentSettled: true });

  assert.deepEqual(result, { ok: false, reason: 'ALREADY_SETTLED' });
});

test('allows first settlement with submitted items', () => {
  const result = canFinalizeSettlement({ submittedItems: 2, paymentSettled: false });

  assert.deepEqual(result, { ok: true });
});
