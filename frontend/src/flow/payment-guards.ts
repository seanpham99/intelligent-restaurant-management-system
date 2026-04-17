export interface SettlementInput {
  submittedItems: number;
  paymentSettled: boolean;
}

export type SettlementResult =
  | { ok: true }
  | { ok: false; reason: 'EMPTY_ORDER' | 'ALREADY_SETTLED' };

export function canFinalizeSettlement(input: SettlementInput): SettlementResult {
  if (input.submittedItems <= 0) {
    return { ok: false, reason: 'EMPTY_ORDER' };
  }

  if (input.paymentSettled) {
    return { ok: false, reason: 'ALREADY_SETTLED' };
  }

  return { ok: true };
}
