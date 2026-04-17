export function isSessionExpired(
  lastActivityAtMs: number,
  nowMs: number,
  timeoutMs: number,
): boolean {
  return nowMs - lastActivityAtMs > timeoutMs;
}

export function shouldApplySessionEpochUpdate(
  currentEpoch: number,
  updateEpoch: number,
): boolean {
  return currentEpoch === updateEpoch;
}
