const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 8000;
const MAX_RETRY_ATTEMPTS = 5;
export const STATUS_STREAM_UNAVAILABLE_MESSAGE = 'Live status unavailable. Please refresh the order board.';

export interface StatusRetryPlan {
  shouldSchedule: boolean;
  delayMs: number | null;
  nextAttempt: number;
  message: string;
  canRetry: boolean;
}

export function nextRetryDelayMs(attempt: number): number {
  const safeAttempt = Math.max(0, attempt);
  return Math.min(MAX_DELAY_MS, BASE_DELAY_MS * (2 ** safeAttempt));
}

export function canRetryStatusStream(attempt: number): boolean {
  return attempt < MAX_RETRY_ATTEMPTS;
}

export function planStatusRetry(attempt: number, retryMessage: string): StatusRetryPlan {
  if (!canRetryStatusStream(attempt)) {
    return {
      shouldSchedule: false,
      delayMs: null,
      nextAttempt: attempt,
      message: STATUS_STREAM_UNAVAILABLE_MESSAGE,
      canRetry: false,
    };
  }

  return {
    shouldSchedule: true,
    delayMs: nextRetryDelayMs(attempt),
    nextAttempt: attempt + 1,
    message: retryMessage,
    canRetry: true,
  };
}
