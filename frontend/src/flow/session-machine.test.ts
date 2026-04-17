import assert from 'node:assert/strict';
import test from 'node:test';
import { transition, FlowState } from './session-machine';

test('Success -> Menu supplement allowed', () => {
  const initialState: FlowState = { screen: 'Success', paymentSettled: false };
  const result = transition(initialState, { type: 'SUPPLEMENT_ORDER' });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.state, { screen: 'Menu', paymentSettled: false });
  }
});

test('Menu -> Payment blocked (INVALID_TRANSITION)', () => {
  const initialState: FlowState = { screen: 'Menu', paymentSettled: false };
  const result = transition(initialState, { type: 'GO_PAYMENT' });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, 'INVALID_TRANSITION');
    assert.deepEqual(result.state, initialState);
  }
});

test('SUPPLEMENT_ORDER blocked when paymentSettled=true (SESSION_CLOSED)', () => {
  const initialState: FlowState = { screen: 'Success', paymentSettled: true };
  const result = transition(initialState, { type: 'SUPPLEMENT_ORDER' });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, 'SESSION_CLOSED');
    assert.deepEqual(result.state, initialState);
  }
});

test('Payment -> Success back allowed', () => {
  const initialState: FlowState = { screen: 'Payment', paymentSettled: false };
  const result = transition(initialState, { type: 'BACK_TO_SUCCESS' });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.state, { screen: 'Success', paymentSettled: false });
  }
});
