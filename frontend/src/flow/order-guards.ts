export type CartLine = { id: string; quantity: number };

export type MenuSnapshotItem = { id: string; soldOut?: boolean };

export type SubmitGuardResult =
  | { ok: true }
  | { ok: false; reason: 'EMPTY_CART' | 'STALE_ITEM' };

export function buildCartFingerprint(cart: ReadonlyArray<CartLine>): string {
  return [...cart]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(line => `${line.id}:${line.quantity}`)
    .join('|');
}

export function canSubmitCart(
  cart: ReadonlyArray<CartLine>,
  menuSnapshot: ReadonlyArray<MenuSnapshotItem>,
): SubmitGuardResult {
  if (cart.length === 0) {
    return { ok: false, reason: 'EMPTY_CART' };
  }

  const snapshotById = new Map(menuSnapshot.map(item => [item.id, item]));
  for (const cartLine of cart) {
    const menuItem = snapshotById.get(cartLine.id);
    if (!menuItem || menuItem.soldOut === true) {
      return { ok: false, reason: 'STALE_ITEM' };
    }
  }

  return { ok: true };
}

export function isDuplicatePendingSubmission(
  fingerprint: string,
  pendingSet: ReadonlySet<string>,
): boolean {
  return pendingSet.has(fingerprint);
}
