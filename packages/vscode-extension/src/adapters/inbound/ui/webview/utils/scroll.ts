/**
 * Scroll Position Utilities
 *
 * Functions for managing and restoring scroll positions.
 */

/**
 * Get the scrollable element (differs between diff table and preview mode)
 */
export function getScrollableElement(): HTMLElement | null {
  const preview = document.querySelector('.markdown-preview');
  if (preview) return preview as HTMLElement;
  return document.getElementById('diff-viewer');
}

/**
 * Save current scroll position to pending restore
 * Returns the current scroll position
 */
export function saveCurrentScrollPosition(): number {
  const scrollEl = getScrollableElement();
  return scrollEl ? scrollEl.scrollTop : 0;
}

/**
 * Restore scroll position to an element
 */
export function restoreScrollPosition(scrollTop: number, retries = 3): void {
  if (scrollTop <= 0) return;

  const restoreScroll = () => {
    const scrollEl = getScrollableElement();
    if (scrollEl) scrollEl.scrollTop = scrollTop;
  };

  // Try multiple times as DOM may not be ready
  restoreScroll();
  if (retries > 0) {
    setTimeout(restoreScroll, 0);
  }
  if (retries > 1) {
    setTimeout(restoreScroll, 50);
  }
  if (retries > 2) {
    setTimeout(restoreScroll, 100);
  }
}
