/**
 * Event Handling Utilities
 *
 * AbortController management for clean event listener cleanup.
 */

let globalAbortController = new AbortController();

/**
 * Reset the global abort controller
 * This aborts all existing event listeners and creates a new controller
 */
export function resetAbortController(): void {
  globalAbortController.abort();
  globalAbortController = new AbortController();
}

/**
 * Get the current abort signal for event listeners
 */
export function getSignal(): AbortSignal {
  return globalAbortController.signal;
}

/**
 * Abort all event listeners and reset
 */
export function abortAllListeners(): void {
  resetAbortController();
}
