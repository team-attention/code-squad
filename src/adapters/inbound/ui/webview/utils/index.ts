/**
 * Utility functions barrel export
 */

export {
  escapeHtml,
  getElementById,
  querySelector,
  querySelectorAll,
} from './dom';
export { resetAbortController, getSignal, abortAllListeners } from './events';
export {
  getScrollableElement,
  saveCurrentScrollPosition,
  restoreScrollPosition,
} from './scroll';
export { SizeLimitedSet, SizeLimitedMap } from './collections';
