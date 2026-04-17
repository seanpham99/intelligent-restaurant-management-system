const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 8000;
const MAX_RETRY_ATTEMPTS = 5;

export function nextRetryDelayMs(attempt: number): number {
  const safeAttempt = Math.max(0, attempt);
  return Math.min(MAX_DELAY_MS, BASE_DELAY_MS * (2 ** safeAttempt));
}

export function canRetryStatusStream(attempt: number): boolean {
  return attempt < MAX_RETRY_ATTEMPTS;
}
