# Task 3: Extract Utility Functions

**Status**: Ready
**Estimated Time**: 1 hour
**Dependencies**: Task 2

## Objective

Extract pure utility functions from `script.ts` into dedicated utility modules. These are the simplest, most isolated functions with no side effects, making them ideal for the first extraction.

## Changes

### Files to Create

1. `/src/adapters/inbound/ui/webview/utils/dom.ts`
2. `/src/adapters/inbound/ui/webview/utils/events.ts`
3. `/src/adapters/inbound/ui/webview/utils/scroll.ts`
4. `/src/adapters/inbound/ui/webview/utils/collections.ts`

### Files to Modify

1. `/src/adapters/inbound/ui/webview/utils/index.ts` - Add exports
2. `/src/adapters/inbound/ui/webview/script.ts` - Import utilities instead of defining them

## Implementation Steps

### Step 1: Create DOM Utilities

Create `/src/adapters/inbound/ui/webview/utils/dom.ts`:

```typescript
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
export function getElementById<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/**
 * Query selector with type safety
 */
export function querySelector<T extends Element = Element>(selector: string): T | null {
  return document.querySelector(selector) as T | null;
}

/**
 * Query selector all with type safety
 */
export function querySelectorAll<T extends Element = Element>(selector: string): NodeListOf<T> {
  return document.querySelectorAll(selector) as NodeListOf<T>;
}
```

**Source**: Lines 2765-2769 of script.ts (`escapeHtml`)

### Step 2: Create Event Utilities

Create `/src/adapters/inbound/ui/webview/utils/events.ts`:

```typescript
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
```

**Source**: Lines 4-13 of script.ts

### Step 3: Create Scroll Utilities

Create `/src/adapters/inbound/ui/webview/utils/scroll.ts`:

```typescript
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
```

**Source**: Lines 365-369, 825-830 of script.ts

### Step 4: Create Collection Utilities

Create `/src/adapters/inbound/ui/webview/utils/collections.ts`:

```typescript
/**
 * Collection Utilities
 *
 * Size-limited Set and Map implementations to prevent memory leaks.
 */

/**
 * Create a size-limited Set that automatically removes oldest entries
 */
export class SizeLimitedSet<T> extends Set<T> {
  constructor(private maxSize: number) {
    super();
  }

  add(value: T): this {
    if (this.size >= this.maxSize) {
      const first = this.values().next().value;
      if (first !== undefined) {
        this.delete(first);
      }
    }
    return super.add(value);
  }
}

/**
 * Create a size-limited Map that automatically removes oldest entries
 */
export class SizeLimitedMap<K, V> extends Map<K, V> {
  constructor(private maxSize: number) {
    super();
  }

  set(key: K, value: V): this {
    if (this.size >= this.maxSize) {
      const firstKey = this.keys().next().value;
      if (firstKey !== undefined) {
        this.delete(firstKey);
      }
    }
    return super.set(key, value);
  }
}
```

**Source**: Derived from lines 35-41 of script.ts (addCollapsedFolder pattern)

### Step 5: Update Utils Index

Modify `/src/adapters/inbound/ui/webview/utils/index.ts`:

```typescript
/**
 * Utility functions barrel export
 */

export { escapeHtml, getElementById, querySelector, querySelectorAll } from './dom';
export { resetAbortController, getSignal, abortAllListeners } from './events';
export { getScrollableElement, saveCurrentScrollPosition, restoreScrollPosition } from './scroll';
export { SizeLimitedSet, SizeLimitedMap } from './collections';
```

### Step 6: Update script.ts to Import Utilities

At the top of `/src/adapters/inbound/ui/webview/script.ts`, add imports:

```typescript
import { escapeHtml } from './utils/dom';
import { resetAbortController, getSignal, abortAllListeners } from './utils/events';
import { getScrollableElement, saveCurrentScrollPosition } from './utils/scroll';
```

Then **remove** or **comment out** these function definitions in script.ts:
- Lines 4-13: `resetAbortController()`, `getSignal()`
- Lines 35-41: `addCollapsedFolder()` (will be replaced by SizeLimitedSet in later tasks)
- Lines 365-369: `getScrollableElement()`
- Lines 2765-2769: `escapeHtml()`

**Important**: Keep all other code in script.ts unchanged. We're only replacing function definitions with imports.

### Step 7: Update Function Calls

Since we're importing the same function names, most calls will work without changes. However, verify:

1. All calls to `escapeHtml()` work (search for `escapeHtml` in script.ts)
2. All calls to `getSignal()` work (search for `getSignal` in script.ts)
3. All calls to `getScrollableElement()` work

### Step 8: Update saveScrollPosition Function

In script.ts, update the `saveScrollPosition()` function (line 825-830) to use the utility:

**Before:**
```typescript
function saveScrollPosition() {
  const scrollEl = getScrollableElement();
  if (scrollEl) {
    pendingScrollRestore = scrollEl.scrollTop;
  }
}
```

**After:**
```typescript
function saveScrollPosition() {
  pendingScrollRestore = saveCurrentScrollPosition();
}
```

## Test Scenarios

### Test 1: Build Verification

**Given**: Utilities extracted to separate files
**When**: Run `npm run esbuild`
**Then**:
- Build completes successfully
- No TypeScript errors
- No import resolution errors

### Test 2: DOM Utilities

**Given**: Extension running with extracted utilities
**When**: Perform actions that use `escapeHtml` (add comment, render file list)
**Then**:
- HTML is properly escaped
- No XSS vulnerabilities
- Text displays correctly

### Test 3: Event Cleanup

**Given**: Webview loaded
**When**: Dispose webview panel
**Then**:
- `abortAllListeners()` called
- All event listeners removed
- No memory leaks

### Test 4: Scroll Position

**Given**: File with diff displayed, scrolled down
**When**: Switch to another file and back
**Then**:
- Scroll position restored correctly
- No jump to top of page

### Test 5: Function Behavior Unchanged

**Given**: Utilities extracted
**When**: Test all features (file list, diff, comments, search)
**Then**:
- All features work identically to before
- No behavioral changes
- No console errors

## Acceptance Criteria

- ✅ All utility modules created
- ✅ All utility functions properly typed
- ✅ script.ts imports utilities instead of defining them
- ✅ No duplicate function definitions
- ✅ Build succeeds with no errors
- ✅ All features function identically
- ✅ No console errors
- ✅ Event cleanup works properly

## Rollback

If issues occur:

1. Remove import statements from script.ts
2. Uncomment original function definitions in script.ts
3. Delete utility files
4. Rebuild

```bash
# Quick rollback
git checkout src/adapters/inbound/ui/webview/script.ts
rm -rf src/adapters/inbound/ui/webview/utils/*
npm run esbuild
```

## Notes

- These are pure functions with no side effects
- Order of extraction doesn't matter (no dependencies between utilities)
- `escapeHtml` is used extensively throughout script.ts (~100+ times)
- `getSignal()` is used in almost every event listener (~50+ times)
- No state changes - utilities are stateless (except AbortController in events.ts)
- SizeLimitedSet/Map will replace manual size checking in later tasks

## Verification Commands

```bash
# Build
npm run esbuild

# Check imports in bundle
grep -c "escapeHtml" dist/webview.js

# Count utility function usage
grep -c "getSignal()" src/adapters/inbound/ui/webview/script.ts

# TypeScript check
npm run compile
```
