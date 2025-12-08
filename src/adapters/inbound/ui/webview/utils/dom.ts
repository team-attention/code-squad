/**
 * DOM Utility Functions
 *
 * Helper functions for DOM manipulation and HTML escaping.
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get element by ID with type safety
 */
export function getElementById<T extends HTMLElement = HTMLElement>(
  id: string
): T | null {
  return document.getElementById(id) as T | null;
}

/**
 * Query selector with type safety
 */
export function querySelector<T extends Element = Element>(
  selector: string
): T | null {
  return document.querySelector(selector) as T | null;
}

/**
 * Query selector all with type safety
 */
export function querySelectorAll<T extends Element = Element>(
  selector: string
): NodeListOf<T> {
  return document.querySelectorAll(selector) as NodeListOf<T>;
}
