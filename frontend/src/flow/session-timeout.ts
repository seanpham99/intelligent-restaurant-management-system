export function isSessionExpired(
  lastActivityAtMs: number,
  nowMs: number,
  timeoutMs: number,
): boolean {
  return nowMs - lastActivityAtMs > timeoutMs;
}
