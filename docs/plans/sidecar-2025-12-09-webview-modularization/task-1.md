# Task 1: Extract FileSearch Component

**Component**: FileSearch
**File**: `src/adapters/inbound/ui/webview/components/sidebar/FileSearch.ts`
**Source Lines**: 141-170 in script.ts
**Complexity**: Low
**Dependencies**: `utils/events.ts` (getSignal)

## Objective

Extract file search input functionality into a dedicated component with search input rendering and debounced event handling.

## Current Code Location

```typescript
// script.ts lines 141-170
// File search input handling with debounce
```

## Functions to Extract

| Function | Description |
|----------|-------------|
| `renderFileSearch()` | Render search input HTML |
| `setupFileSearchHandlers()` | Attach input handlers with debounce |

## Implementation

### 1. Create FileSearch.ts

```typescript
// components/sidebar/FileSearch.ts

export interface FileSearchHandlers {
  onSearchQueryChange: (query: string) => void;
}

/**
 * Render file search input HTML
 * @param searchQuery - Current search query value
 * @returns HTML string for search input
 */
export function renderFileSearch(searchQuery: string): string {
  // Extract from script.ts
}

/**
 * Setup file search input handlers
 * @param handlers - Event handlers
 * @param signal - AbortSignal for cleanup
 * @param debounceMs - Debounce delay in milliseconds (default 150)
 */
export function setupFileSearchHandlers(
  handlers: FileSearchHandlers,
  signal: AbortSignal,
  debounceMs?: number
): void {
  // Extract debounce logic and input listener from script.ts
}
```

### 2. Update Index

Add export to `components/sidebar/index.ts` (create if not exists).

### 3. Update script.ts

Replace inline code with import and call to extracted functions.

## Files to Create/Modify

| File | Action |
|------|--------|
| `components/sidebar/FileSearch.ts` | Create |
| `components/sidebar/index.ts` | Create/Update |
| `script.ts` | Update (replace inline code) |

## Test Scenarios

### TS1: Search Input Renders
- **Given**: Webview loads
- **When**: Sidebar is visible
- **Then**: Search input is displayed with placeholder text

### TS2: Search Query Updates
- **Given**: Search input is focused
- **When**: User types "test"
- **Then**: File list filters after debounce delay

### TS3: Search Clears
- **Given**: Search input has value "test"
- **When**: User clears input
- **Then**: File list shows all files

### TS4: Handler Cleanup
- **Given**: Search handlers are attached
- **When**: AbortController is aborted
- **Then**: Event listeners are removed (no memory leak)

## Acceptance Criteria

- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] Search input renders correctly
- [ ] Debounced search works as before
- [ ] No console errors
- [ ] File size < 100 lines

## Rollback

If issues arise, revert the single commit for this task.
