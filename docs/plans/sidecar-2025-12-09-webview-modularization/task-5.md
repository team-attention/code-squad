# Task 5: Extract DiffSearch Component

**Component**: DiffSearch
**File**: `src/adapters/inbound/ui/webview/components/diff/DiffSearch.ts`
**Source Lines**: 172-360 in script.ts
**Complexity**: Medium
**Dependencies**: `utils/dom.ts` (escapeHtml), constants (MAX_SEARCH_MATCHES)

## Objective

Extract diff search functionality including search execution, match highlighting, and navigation between matches.

## Current Code Location

```typescript
// script.ts lines 172-360
// Diff search: performDiffSearch, highlightDiffMatches, navigateDiffSearch
```

## Functions to Extract

| Function | Description |
|----------|-------------|
| `performDiffSearch()` | Execute search in diff content |
| `highlightDiffMatches()` | Add highlight spans to matches |
| `navigateDiffSearch()` | Navigate to next/previous match |
| `clearDiffHighlights()` | Remove all highlights |
| `updateMatchCounter()` | Update "X of Y" counter |
| `updateNavButtons()` | Enable/disable nav buttons |
| `openDiffSearch()` | Show search input (Cmd+F) |
| `closeDiffSearch()` | Hide search input (Escape) |

## Implementation

### 1. Create DiffSearch.ts

```typescript
// components/diff/DiffSearch.ts

import { escapeHtml } from '../../utils/dom';

export interface DiffSearchState {
  query: string;
  matches: SearchMatch[];
  currentIndex: number;
}

export interface SearchMatch {
  element: HTMLElement;
  text: string;
  lineNumber: number;
}

export interface DiffSearchElements {
  searchInput: HTMLInputElement;
  searchCounter: HTMLElement;
  prevButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  closeButton: HTMLButtonElement;
}

/**
 * Perform search in diff content
 * @param query - Search query
 * @param diffContainer - Diff content container
 * @param maxMatches - Maximum matches to find
 * @returns Array of search matches
 */
export function performDiffSearch(
  query: string,
  diffContainer: HTMLElement,
  maxMatches: number
): SearchMatch[] {
  // Extract from script.ts
}

/**
 * Highlight matches in diff content
 * @param matches - Matches to highlight
 */
export function highlightDiffMatches(matches: SearchMatch[]): void {
  // Extract from script.ts
}

/**
 * Navigate to match by index
 * @param matches - All matches
 * @param index - Target index
 * @returns New current index
 */
export function navigateDiffSearch(
  matches: SearchMatch[],
  index: number
): number {
  // Extract from script.ts
}

/**
 * Clear all search highlights
 * @param diffContainer - Diff content container
 */
export function clearDiffHighlights(diffContainer: HTMLElement): void {
  // Extract from script.ts
}

/**
 * Setup diff search keyboard and button handlers
 * @param elements - Search UI elements
 * @param onStateChange - Callback when search state changes
 * @param signal - AbortSignal for cleanup
 */
export function setupDiffSearchHandlers(
  elements: DiffSearchElements,
  onStateChange: (state: DiffSearchState) => void,
  signal: AbortSignal
): void {
  // Extract keyboard (Cmd+F, Escape, Enter, Shift+Enter) handlers
  // Extract button click handlers
}
```

### 2. Create index file

Create `components/diff/index.ts` for diff component exports.

### 3. Update script.ts

Replace inline code with import and call to extracted functions.

## Files to Create/Modify

| File | Action |
|------|--------|
| `components/diff/DiffSearch.ts` | Create |
| `components/diff/index.ts` | Create |
| `script.ts` | Update |

## Test Scenarios

### TS1: Open Search
- **Given**: Diff is displayed
- **When**: User presses Cmd+F (Mac) or Ctrl+F (Win)
- **Then**: Search input appears and focuses

### TS2: Search Finds Matches
- **Given**: Diff contains "function"
- **When**: User types "function"
- **Then**: All occurrences highlight, counter shows "1 of N"

### TS3: Navigate Next
- **Given**: 5 matches found, at match 1
- **When**: User presses Enter or clicks Next
- **Then**: Scrolls to match 2, counter shows "2 of 5"

### TS4: Navigate Previous
- **Given**: 5 matches found, at match 3
- **When**: User presses Shift+Enter or clicks Prev
- **Then**: Scrolls to match 2, counter shows "2 of 5"

### TS5: Navigate Wraps
- **Given**: 5 matches found, at match 5
- **When**: User presses Enter
- **Then**: Wraps to match 1, counter shows "1 of 5"

### TS6: Close Search
- **Given**: Search is open
- **When**: User presses Escape
- **Then**: Search closes, highlights cleared

### TS7: No Matches
- **Given**: Diff doesn't contain "xyz123"
- **When**: User searches "xyz123"
- **Then**: Counter shows "0 of 0", nav buttons disabled

### TS8: Max Matches Limit
- **Given**: Diff has 1000 occurrences of "a"
- **When**: User searches "a"
- **Then**: Only MAX_SEARCH_MATCHES (500) highlights

## Acceptance Criteria

- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] Cmd+F opens search
- [ ] Search highlights matches
- [ ] Navigation works (Enter, Shift+Enter, buttons)
- [ ] Escape closes search
- [ ] Counter updates correctly
- [ ] Wrapping works at boundaries
- [ ] Max matches limit enforced
- [ ] No console errors
- [ ] File size < 250 lines

## Rollback

If issues arise, revert the single commit for this task.
