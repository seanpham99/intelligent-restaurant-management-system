export type Screen = 'Welcome' | 'Menu' | 'Confirmation' | 'Success' | 'Payment';

export type FlowError = 'INVALID_TRANSITION' | 'SESSION_CLOSED';

export interface FlowState {
  screen: Screen;
  paymentSettled: boolean;
}

export type FlowEvent =
  | { type: 'VIEW_MENU' }
  | { type: 'REVIEW_ORDER' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUPPLEMENT_ORDER' }
  | { type: 'GO_PAYMENT' }
  | { type: 'SETTLE_PAYMENT' };

type TransitionResult =
  | { ok: true; state: FlowState }
  | { ok: false; state: FlowState; error: FlowError };

const invalidTransition = (state: FlowState): TransitionResult => ({
  ok: false,
  state,
  error: 'INVALID_TRANSITION',
});

const closedSession = (state: FlowState): TransitionResult => ({
  ok: false,
  state,
  error: 'SESSION_CLOSED',
});

const successTransition = (state: FlowState): TransitionResult => ({
  ok: true,
  state,
});

export function transition(state: FlowState, event: FlowEvent): TransitionResult {
  switch (event.type) {
    case 'VIEW_MENU':
      if (state.screen === 'Welcome') {
        return successTransition({ screen: 'Menu', paymentSettled: false });
      }
      if (state.screen === 'Confirmation') {
        return successTransition({ screen: 'Menu', paymentSettled: state.paymentSettled });
      }
      return invalidTransition(state);
    case 'REVIEW_ORDER':
      if (state.screen === 'Menu') {
        return successTransition({ screen: 'Confirmation', paymentSettled: state.paymentSettled });
      }
      return invalidTransition(state);
    case 'SUBMIT_SUCCESS':
      if (state.screen === 'Confirmation') {
        return successTransition({ screen: 'Success', paymentSettled: state.paymentSettled });
      }
      return invalidTransition(state);
    case 'SUPPLEMENT_ORDER':
      if (state.screen !== 'Success') {
        return invalidTransition(state);
      }
      if (state.paymentSettled) {
        return closedSession(state);
      }
      return successTransition({ screen: 'Menu', paymentSettled: false });
    case 'GO_PAYMENT':
      if (state.screen === 'Success') {
        return successTransition({ screen: 'Payment', paymentSettled: state.paymentSettled });
      }
      return invalidTransition(state);
    case 'SETTLE_PAYMENT':
      if (state.screen === 'Payment') {
        return successTransition({ screen: 'Welcome', paymentSettled: true });
      }
      return invalidTransition(state);
    default:
      return invalidTransition(state);
  }
}
