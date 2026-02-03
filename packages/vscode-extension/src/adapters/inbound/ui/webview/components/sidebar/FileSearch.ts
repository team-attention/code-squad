/**
 * File Search Component
 *
 * Search input for filtering files in the sidebar.
 */

export interface FileSearchHandlers {
  onSearchQueryChange: (query: string) => void;
}

/**
 * Setup file search input handlers
 * @param handlers - Event handlers for search events
 * @param signal - AbortSignal for cleanup
 * @param debounceMs - Debounce delay in milliseconds (default 200)
 */
export function setupFileSearchHandlers(
  handlers: FileSearchHandlers,
  signal: AbortSignal,
  debounceMs = 200
): void {
  const searchInput = document.getElementById(
    'file-search'
  ) as HTMLInputElement | null;
  const searchClear = document.getElementById('search-clear');

  if (!searchInput || !searchClear) return;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  searchInput.addEventListener(
    'input',
    (e) => {
      const query = (e.target as HTMLInputElement).value;
      searchClear.style.display = query ? 'flex' : 'none';

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        handlers.onSearchQueryChange(query);
      }, debounceMs);
    },
    { signal }
  );

  searchClear.addEventListener(
    'click',
    () => {
      searchInput.value = '';
      searchClear.style.display = 'none';
      handlers.onSearchQueryChange('');
    },
    { signal }
  );
}
