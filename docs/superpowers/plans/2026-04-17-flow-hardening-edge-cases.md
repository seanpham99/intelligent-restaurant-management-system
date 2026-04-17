# Flow Hardening Edge Cases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the current onboarding-to-payment frontend flow so edge cases are handled explicitly and invalid transitions are prevented.

**Architecture:** Introduce a small, pure TypeScript flow-state layer (`frontend/src/flow/*`) that enforces allowed transitions and guards mutations (submit, add-more, settle). Keep UI components focused on rendering; move edge-case logic into testable helpers/reducers and wire `App.tsx` as the orchestration layer. Use existing backend APIs (`/menu/list_items`, `/order/create`, `/order/status`) and avoid adding new backend endpoints for this hardening pass.

**Tech Stack:** React 19, TypeScript, Vite, Node test runner via `tsx --test`, existing frontend lint/build pipeline.

---

## File structure and responsibilities

- **Flow and guard domain (new)**
  - Create: `frontend/src/flow/session-machine.ts` — legal screen/session transitions.
  - Create: `frontend/src/flow/order-guards.ts` — cart/order submission validation + duplicate prevention.
  - Create: `frontend/src/flow/status-connection.ts` — status websocket state transitions + retry policy.
  - Create: `frontend/src/flow/payment-guards.ts` — payment settle preconditions and lock semantics.
  - Create: `frontend/src/flow/session-timeout.ts` — session inactivity timeout checks.

- **Flow tests (new)**
  - Create: `frontend/src/flow/session-machine.test.ts`
  - Create: `frontend/src/flow/order-guards.test.ts`
  - Create: `frontend/src/flow/status-connection.test.ts`
  - Create: `frontend/src/flow/payment-guards.test.ts`
  - Create: `frontend/src/flow/session-timeout.test.ts`

- **Frontend wiring (existing)**
  - Modify: `frontend/src/App.tsx` — central orchestration using the new flow helpers.
  - Modify: `frontend/src/api/client.ts` — request timeout/abort support for network hardening.
  - Modify: `frontend/src/api/order.ts` — order create helper compatible with submit dedupe flow.
  - Modify: `frontend/src/components/ConfirmationScreen.tsx` — explicit edge-case feedback on blocked submit.
  - Modify: `frontend/src/components/SuccessScreen.tsx` — robust status state and retry copy.
  - Modify: `frontend/src/components/PaymentScreen.tsx` — settlement lock and guard-based disable rules.
  - Modify: `frontend/package.json` — add `test:flow` script.
  - Modify: `frontend/README.md` — document hardened flow behavior and manual validation scenarios.

---

### Task 1: Introduce session transition state machine

**Files:**
- Create: `frontend/src/flow/session-machine.ts`
- Create: `frontend/src/flow/session-machine.test.ts`
- Modify: `frontend/package.json`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Write the failing transition tests**

```ts
// frontend/src/flow/session-machine.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { transition, type FlowState, type FlowEvent } from './session-machine';

test('allows supplement flow: Success -> Menu', () => {
  const next = transition(
    { screen: 'Success', paymentSettled: false } satisfies FlowState,
    { type: 'SUPPLEMENT_ORDER' } satisfies FlowEvent,
  );
  assert.equal(next.screen, 'Menu');
});

test('blocks invalid jump: Menu -> Payment', () => {
  const next = transition(
    { screen: 'Menu', paymentSettled: false } satisfies FlowState,
    { type: 'GO_PAYMENT' } satisfies FlowEvent,
  );
  assert.equal(next.screen, 'Menu');
  assert.equal(next.lastError, 'INVALID_TRANSITION');
});

test('blocks add-more after payment settled', () => {
  const next = transition(
    { screen: 'Welcome', paymentSettled: true } satisfies FlowState,
    { type: 'SUPPLEMENT_ORDER' } satisfies FlowEvent,
  );
  assert.equal(next.paymentSettled, true);
  assert.equal(next.lastError, 'SESSION_CLOSED');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx tsx --test src/flow/session-machine.test.ts`  
Expected: FAIL with module/function-not-found errors for `session-machine.ts`.

- [ ] **Step 3: Write minimal transition implementation**

```ts
// frontend/src/flow/session-machine.ts
export type Screen = 'Welcome' | 'Menu' | 'Confirmation' | 'Success' | 'Payment';
export type FlowError = 'INVALID_TRANSITION' | 'SESSION_CLOSED';

export type FlowState = {
  screen: Screen;
  paymentSettled: boolean;
  lastError?: FlowError;
};

export type FlowEvent =
  | { type: 'VIEW_MENU' }
  | { type: 'REVIEW_ORDER' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUPPLEMENT_ORDER' }
  | { type: 'GO_PAYMENT' }
  | { type: 'SETTLE_PAYMENT' };

export function transition(state: FlowState, event: FlowEvent): FlowState {
  if (state.paymentSettled && event.type === 'SUPPLEMENT_ORDER') {
    return { ...state, lastError: 'SESSION_CLOSED' };
  }

  switch (event.type) {
    case 'VIEW_MENU':
      return { ...state, screen: 'Menu', lastError: undefined };
    case 'REVIEW_ORDER':
      return state.screen === 'Menu'
        ? { ...state, screen: 'Confirmation', lastError: undefined }
        : { ...state, lastError: 'INVALID_TRANSITION' };
    case 'SUBMIT_SUCCESS':
      return state.screen === 'Confirmation'
        ? { ...state, screen: 'Success', lastError: undefined }
        : { ...state, lastError: 'INVALID_TRANSITION' };
    case 'SUPPLEMENT_ORDER':
      return state.screen === 'Success'
        ? { ...state, screen: 'Menu', lastError: undefined }
        : { ...state, lastError: 'INVALID_TRANSITION' };
    case 'GO_PAYMENT':
      return state.screen === 'Success'
        ? { ...state, screen: 'Payment', lastError: undefined }
        : { ...state, lastError: 'INVALID_TRANSITION' };
    case 'SETTLE_PAYMENT':
      return { ...state, screen: 'Welcome', paymentSettled: true, lastError: undefined };
    default:
      return state;
  }
}
```

```json
// frontend/package.json
{
  "scripts": {
    "test:flow": "tsx --test src/flow/**/*.test.ts"
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd frontend && npm run test:flow -- src/flow/session-machine.test.ts`  
Expected: PASS (3 passing tests).

- [ ] **Step 5: Wire App navigation through transition helper and commit**

```ts
// frontend/src/App.tsx (example)
import { transition } from './flow/session-machine';
// replace direct setCurrentScreen(...) calls with transition(...) wrappers
```

```bash
git add frontend/src/flow/session-machine.ts frontend/src/flow/session-machine.test.ts frontend/src/App.tsx frontend/package.json
git commit -m "feat: add session transition state machine for flow hardening"
```

---

### Task 2: Harden order submission guards (empty, stale, duplicate)

**Files:**
- Create: `frontend/src/flow/order-guards.ts`
- Create: `frontend/src/flow/order-guards.test.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/ConfirmationScreen.tsx`

- [ ] **Step 1: Write failing guard tests**

```ts
// frontend/src/flow/order-guards.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canSubmitCart,
  buildCartFingerprint,
  isDuplicatePendingSubmission,
  type MenuSnapshotItem,
} from './order-guards';

test('rejects empty cart', () => {
  const result = canSubmitCart([], []);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'EMPTY_CART');
});

test('rejects stale sold-out item', () => {
  const cart = [{ id: '7', quantity: 1 }] as const;
  const menu = [{ id: '7', soldOut: true }] as MenuSnapshotItem[];
  const result = canSubmitCart(cart, menu);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'STALE_ITEM');
});

test('detects duplicate pending submission', () => {
  const fp = buildCartFingerprint([{ id: '1', quantity: 2 }]);
  assert.equal(isDuplicatePendingSubmission(fp, new Set([fp])), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test:flow -- src/flow/order-guards.test.ts`  
Expected: FAIL with missing exports/module errors.

- [ ] **Step 3: Implement minimal guard logic**

```ts
// frontend/src/flow/order-guards.ts
export type CartLine = { id: string; quantity: number };
export type MenuSnapshotItem = { id: string; soldOut?: boolean };
export type SubmitGuardResult =
  | { ok: true }
  | { ok: false; reason: 'EMPTY_CART' | 'STALE_ITEM' };

export function buildCartFingerprint(cart: ReadonlyArray<CartLine>): string {
  return [...cart]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(item => `${item.id}:${item.quantity}`)
    .join('|');
}

export function canSubmitCart(
  cart: ReadonlyArray<CartLine>,
  menuSnapshot: ReadonlyArray<MenuSnapshotItem>,
): SubmitGuardResult {
  if (cart.length === 0) return { ok: false, reason: 'EMPTY_CART' };
  const byId = new Map(menuSnapshot.map(item => [item.id, item]));
  const hasStale = cart.some(item => !byId.get(item.id) || byId.get(item.id)?.soldOut);
  return hasStale ? { ok: false, reason: 'STALE_ITEM' } : { ok: true };
}

export function isDuplicatePendingSubmission(
  fingerprint: string,
  pendingFingerprints: ReadonlySet<string>,
): boolean {
  return pendingFingerprints.has(fingerprint);
}
```

- [ ] **Step 4: Wire guards into submit path and show explicit error copy**

```ts
// frontend/src/App.tsx (inside handleSubmitOrder)
const fingerprint = buildCartFingerprint(cart.map(i => ({ id: i.id, quantity: i.quantity })));
if (isDuplicatePendingSubmission(fingerprint, pendingSubmissionFingerprintsRef.current)) {
  setCreateOrderError('This order is already being submitted. Please wait.');
  return;
}
const guard = canSubmitCart(cart, menuItems);
if (!guard.ok) {
  setCreateOrderError(
    guard.reason === 'EMPTY_CART'
      ? 'Your cart is empty. Please add at least one item before submitting.'
      : 'Some selected items are no longer available. Please review your cart.',
  );
  return;
}
```

- [ ] **Step 5: Re-run tests, type-check, and commit**

Run:
1. `cd frontend && npm run test:flow -- src/flow/order-guards.test.ts`
2. `cd frontend && npm run lint`  
Expected: PASS for tests and type-check.

```bash
git add frontend/src/flow/order-guards.ts frontend/src/flow/order-guards.test.ts frontend/src/App.tsx frontend/src/components/ConfirmationScreen.tsx
git commit -m "feat: harden order submission with stale and duplicate guards"
```

---

### Task 3: Harden live status stream retry behavior

**Files:**
- Create: `frontend/src/flow/status-connection.ts`
- Create: `frontend/src/flow/status-connection.test.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/SuccessScreen.tsx`

- [ ] **Step 1: Write failing retry-policy tests**

```ts
// frontend/src/flow/status-connection.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { nextRetryDelayMs, canRetryStatusStream } from './status-connection';

test('uses bounded exponential backoff', () => {
  assert.equal(nextRetryDelayMs(0), 500);
  assert.equal(nextRetryDelayMs(1), 1000);
  assert.equal(nextRetryDelayMs(5), 8000);
});

test('caps retry attempts at 5', () => {
  assert.equal(canRetryStatusStream(4), true);
  assert.equal(canRetryStatusStream(5), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test:flow -- src/flow/status-connection.test.ts`  
Expected: FAIL with missing module/functions.

- [ ] **Step 3: Implement retry policy helper**

```ts
// frontend/src/flow/status-connection.ts
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 8000;
const MAX_ATTEMPTS = 5;

export function nextRetryDelayMs(attempt: number): number {
  return Math.min(BASE_DELAY_MS * (2 ** attempt), MAX_DELAY_MS);
}

export function canRetryStatusStream(attempt: number): boolean {
  return attempt < MAX_ATTEMPTS;
}
```

- [ ] **Step 4: Wire retry policy into App websocket retry**

```ts
// frontend/src/App.tsx (status retry handler shape)
if (!canRetryStatusStream(nextAttempt)) {
  setStatusConnectionMessage('Live status unavailable. Please refresh the order board.');
  return;
}
setTimeout(() => setStatusRetryKey(prev => prev + 1), nextRetryDelayMs(nextAttempt));
```

- [ ] **Step 5: Verify and commit**

Run:
1. `cd frontend && npm run test:flow -- src/flow/status-connection.test.ts`
2. `cd frontend && npm run lint`  
Expected: PASS.

```bash
git add frontend/src/flow/status-connection.ts frontend/src/flow/status-connection.test.ts frontend/src/App.tsx frontend/src/components/SuccessScreen.tsx
git commit -m "feat: harden websocket status retries with bounded backoff"
```

---

### Task 4: Harden payment finalization guards and settlement lock

**Files:**
- Create: `frontend/src/flow/payment-guards.ts`
- Create: `frontend/src/flow/payment-guards.test.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/PaymentScreen.tsx`

- [ ] **Step 1: Write failing payment guard tests**

```ts
// frontend/src/flow/payment-guards.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { canFinalizeSettlement } from './payment-guards';

test('blocks settlement with empty submitted cart', () => {
  const result = canFinalizeSettlement({ submittedItems: 0, paymentSettled: false });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'EMPTY_ORDER');
});

test('blocks settlement when already settled', () => {
  const result = canFinalizeSettlement({ submittedItems: 2, paymentSettled: true });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'ALREADY_SETTLED');
});

test('allows first settlement with submitted items', () => {
  const result = canFinalizeSettlement({ submittedItems: 2, paymentSettled: false });
  assert.equal(result.ok, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test:flow -- src/flow/payment-guards.test.ts`  
Expected: FAIL with missing module/functions.

- [ ] **Step 3: Implement minimal payment guard**

```ts
// frontend/src/flow/payment-guards.ts
type SettlementInput = { submittedItems: number; paymentSettled: boolean };
type SettlementResult =
  | { ok: true }
  | { ok: false; reason: 'EMPTY_ORDER' | 'ALREADY_SETTLED' };

export function canFinalizeSettlement(input: SettlementInput): SettlementResult {
  if (input.submittedItems <= 0) return { ok: false, reason: 'EMPTY_ORDER' };
  if (input.paymentSettled) return { ok: false, reason: 'ALREADY_SETTLED' };
  return { ok: true };
}
```

- [ ] **Step 4: Wire guard into Payment/App settle path**

```ts
// frontend/src/App.tsx (in onConfirm for Payment)
const settleCheck = canFinalizeSettlement({
  submittedItems: submittedCart.length,
  paymentSettled,
});
if (!settleCheck.ok) {
  setStatusConnectionMessage(
    settleCheck.reason === 'EMPTY_ORDER'
      ? 'No submitted order available for settlement.'
      : 'This session has already been settled.',
  );
  return;
}
setPaymentSettled(true);
```

```ts
// frontend/src/components/PaymentScreen.tsx
// disable button when guard says not allowed; display guard message region above CTA
```

- [ ] **Step 5: Verify and commit**

Run:
1. `cd frontend && npm run test:flow -- src/flow/payment-guards.test.ts`
2. `cd frontend && npm run lint`  
Expected: PASS.

```bash
git add frontend/src/flow/payment-guards.ts frontend/src/flow/payment-guards.test.ts frontend/src/App.tsx frontend/src/components/PaymentScreen.tsx
git commit -m "feat: add settlement lock and payment precondition guards"
```

---

### Task 5: Add inactivity timeout + update hardening documentation

**Files:**
- Create: `frontend/src/flow/session-timeout.ts`
- Create: `frontend/src/flow/session-timeout.test.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/WelcomeScreen.tsx`
- Modify: `frontend/README.md`

- [ ] **Step 1: Write failing timeout tests**

```ts
// frontend/src/flow/session-timeout.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { isSessionExpired } from './session-timeout';

test('expires when inactivity exceeds timeout', () => {
  const expired = isSessionExpired(0, 310000, 300000);
  assert.equal(expired, true);
});

test('does not expire within timeout window', () => {
  const expired = isSessionExpired(0, 299000, 300000);
  assert.equal(expired, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test:flow -- src/flow/session-timeout.test.ts`  
Expected: FAIL with missing module/function.

- [ ] **Step 3: Implement timeout helper and App reset hook**

```ts
// frontend/src/flow/session-timeout.ts
export function isSessionExpired(
  lastActivityAtMs: number,
  nowMs: number,
  timeoutMs: number,
): boolean {
  return nowMs - lastActivityAtMs > timeoutMs;
}
```

```ts
// frontend/src/App.tsx (shape)
const TIMEOUT_MS = 5 * 60 * 1000;
const [lastActivityAt, setLastActivityAt] = useState(Date.now());
useEffect(() => {
  const tick = setInterval(() => {
    if (isSessionExpired(lastActivityAt, Date.now(), TIMEOUT_MS)) {
      resetSessionToWelcome();
    }
  }, 1000);
  return () => clearInterval(tick);
}, [lastActivityAt]);
```

- [ ] **Step 4: Document hardened edge-case behavior**

```md
<!-- frontend/README.md -->
## Hardened flow behaviors
- Invalid transitions are blocked by a typed flow state machine.
- Duplicate submit attempts for the same pending cart are blocked.
- Settlement is single-use per session.
- Inactive sessions reset to Welcome after 5 minutes.
```

- [ ] **Step 5: Full verification and commit**

Run:
1. `cd frontend && npm run test:flow`
2. `cd frontend && npm run lint`
3. `cd frontend && npm run build`  
Expected: all pass, build artifact generated.

```bash
git add frontend/src/flow/session-timeout.ts frontend/src/flow/session-timeout.test.ts frontend/src/App.tsx frontend/src/components/WelcomeScreen.tsx frontend/README.md
git commit -m "feat: add inactivity timeout and document hardened flow behavior"
```

---

## Self-review against scoped requirements

- **Spec coverage:** Plan covers core hardening edges requested: invalid transitions, empty/duplicate/stale submit, add-more loop safety, status retry hardening, payment lock, and inactivity reset.
- **Placeholder scan:** No TBD/TODO placeholders; each task lists concrete files, code snippets, and commands.
- **Type consistency:** Flow types (`FlowState`, `FlowEvent`, guard result unions) are introduced once and reused consistently across tests and App wiring.

