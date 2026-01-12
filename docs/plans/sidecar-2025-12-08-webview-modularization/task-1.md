# Task 1: Infrastructure Setup

**Status**: Ready
**Estimated Time**: 1-2 hours
**Dependencies**: None

## Objective

Create the directory structure and foundational modules for the webview modularization without breaking existing functionality.

## Changes

### Files to Create

1. `/src/adapters/inbound/ui/webview/state/index.ts`
2. `/src/adapters/inbound/ui/webview/state/types.ts`
3. `/src/adapters/inbound/ui/webview/state/StateManager.ts`
4. `/src/adapters/inbound/ui/webview/utils/index.ts`
5. `/src/adapters/inbound/ui/webview/components/index.ts`
6. `/src/adapters/inbound/ui/webview/main.ts`

### Files to Modify

None in this task - we're only adding new files.

## Implementation Steps

### Step 1: Create Directory Structure

```bash
mkdir -p src/adapters/inbound/ui/webview/state
mkdir -p src/adapters/inbound/ui/webview/utils
mkdir -p src/adapters/inbound/ui/webview/components/sidebar
mkdir -p src/adapters/inbound/ui/webview/components/diff
mkdir -p src/adapters/inbound/ui/webview/components/waiting
```

### Step 2: Create State Types

Create `state/types.ts`:

```typescript
/**
 * Webview UI State Types
 *
 * All state managed by the webview client-side.
 * This is separate from application state sent from the extension.
 */

export interface SelectionState {
  selectedLineNum: number | null;
  selectedLineElement: HTMLElement | null;
  selectionStartLine: number | null;
  selectionEndLine: number | null;
  selectionStartRow: HTMLElement | null;
  selectionEndRow: HTMLElement | null;
  isSelecting: boolean;
}

export interface UIState {
  isResizing: boolean;
  sidebarWidth: number;
  pendingScrollRestore: number | null;
  currentFile: string | null;
}

export interface SearchState {
  // File search
  currentSearchQuery: string;
  searchDebounceTimer: number | null;

  // Diff search
  diffSearchQuery: string;
  diffSearchMatches: any[];
  diffSearchCurrentIndex: number;
}

export interface ViewState {
  // Tree view
  collapsedFolders: Set<string>;

  // Scoped diff
  scopedDiffCurrentFile: string | null;
  scopedDiffHighlightMap: Map<number, string>;

  // Preview comment
  previewCurrentFile: string | null;
  previewDragStartBlock: HTMLElement | null;
  previewDragEndBlock: HTMLElement | null;
  previewIsDragging: boolean;
}

export interface WebviewState {
  selection: SelectionState;
  ui: UIState;
  search: SearchState;
  view: ViewState;
}
```

### Step 3: Create StateManager Skeleton

Create `state/StateManager.ts`:

```typescript
/**
 * StateManager
 *
 * Centralized state management for webview UI.
 * Replaces global variables from script.ts with controlled state access.
 */

import type { WebviewState, SelectionState, UIState, SearchState, ViewState } from './types';

// Size limits for collections
export const MAX_COLLAPSED_FOLDERS = 1000;
export const MAX_SEARCH_MATCHES = 500;
export const MAX_HIGHLIGHT_ENTRIES = 10000;

export class StateManager {
  private state: WebviewState;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): WebviewState {
    return {
      selection: {
        selectedLineNum: null,
        selectedLineElement: null,
        selectionStartLine: null,
        selectionEndLine: null,
        selectionStartRow: null,
        selectionEndRow: null,
        isSelecting: false,
      },
      ui: {
        isResizing: false,
        sidebarWidth: 320,
        pendingScrollRestore: null,
        currentFile: null,
      },
      search: {
        currentSearchQuery: '',
        searchDebounceTimer: null,
        diffSearchQuery: '',
        diffSearchMatches: [],
        diffSearchCurrentIndex: -1,
      },
      view: {
        collapsedFolders: new Set(),
        scopedDiffCurrentFile: null,
        scopedDiffHighlightMap: new Map(),
        previewCurrentFile: null,
        previewDragStartBlock: null,
        previewDragEndBlock: null,
        previewIsDragging: false,
      },
    };
  }

  // Getters for read access
  getSelection(): SelectionState {
    return this.state.selection;
  }

  getUI(): UIState {
    return this.state.ui;
  }

  getSearch(): SearchState {
    return this.state.search;
  }

  getView(): ViewState {
    return this.state.view;
  }

  // Setters for controlled mutations
  setSelection(partial: Partial<SelectionState>): void {
    this.state.selection = { ...this.state.selection, ...partial };
  }

  setUI(partial: Partial<UIState>): void {
    this.state.ui = { ...this.state.ui, ...partial };
  }

  setSearch(partial: Partial<SearchState>): void {
    this.state.search = { ...this.state.search, ...partial };
  }

  setView(partial: Partial<ViewState>): void {
    this.state.view = { ...this.state.view, ...partial };
  }

  // Collection helpers with size limits
  addCollapsedFolder(folderPath: string): void {
    if (this.state.view.collapsedFolders.size >= MAX_COLLAPSED_FOLDERS) {
      const first = this.state.view.collapsedFolders.values().next().value;
      if (first) this.state.view.collapsedFolders.delete(first);
    }
    this.state.view.collapsedFolders.add(folderPath);
  }

  removeCollapsedFolder(folderPath: string): void {
    this.state.view.collapsedFolders.delete(folderPath);
  }

  // Cleanup
  reset(): void {
    // Clear collections
    this.state.view.collapsedFolders.clear();
    this.state.search.diffSearchMatches = [];
    this.state.view.scopedDiffHighlightMap.clear();

    // Reset to initial state
    this.state = this.getInitialState();
  }
}

// Export singleton instance (will be used by components)
export const stateManager = new StateManager();
```

### Step 4: Create State Index

Create `state/index.ts`:

```typescript
export { StateManager, stateManager, MAX_COLLAPSED_FOLDERS, MAX_SEARCH_MATCHES, MAX_HIGHLIGHT_ENTRIES } from './StateManager';
export type { WebviewState, SelectionState, UIState, SearchState, ViewState } from './types';
```

### Step 5: Create Utils Index

Create `utils/index.ts`:

```typescript
/**
 * Utility functions barrel export
 *
 * Will be populated in Task 3
 */

// Placeholder - will be populated in next task
export {};
```

### Step 6: Create Components Index

Create `components/index.ts`:

```typescript
/**
 * Component barrel export
 *
 * Will be populated as components are extracted
 */

// Placeholder - will be populated in later tasks
export {};
```

### Step 7: Create Main Entry Point Skeleton

Create `main.ts`:

```typescript
/**
 * Webview Main Entry Point
 *
 * This will replace script.ts as the main orchestrator.
 * For now, it re-exports the existing script to maintain functionality.
 */

// Import existing script to keep functionality during migration
import { webviewScript } from './script';

// Re-export for now - will be replaced incrementally
export { webviewScript };
```

## Test Scenarios

### Test 1: Build Verification

**Given**: New directory structure created
**When**: Run `npm run esbuild`
**Then**:
- Build completes successfully
- No TypeScript errors
- `dist/extension.js` and `dist/webview.js` generated

### Test 2: Extension Loads

**Given**: Extension built with new structure
**When**: Launch VSCode with extension
**Then**:
- Extension activates without errors
- Webview panel opens
- No console errors

### Test 3: Module Resolution

**Given**: New modules created
**When**: Import StateManager in main.ts
**Then**:
- TypeScript resolves imports correctly
- No module not found errors

## Acceptance Criteria

- ✅ All directories created
- ✅ All skeleton files created with proper TypeScript types
- ✅ Build completes successfully
- ✅ No TypeScript errors
- ✅ Extension loads and functions exactly as before
- ✅ StateManager exports working
- ✅ No console errors

## Rollback

If issues occur:
1. Delete all new directories: `rm -rf src/adapters/inbound/ui/webview/{state,utils,components,main.ts}`
2. Revert any changes to build scripts

## Notes

- This task only adds new files, doesn't modify existing functionality
- StateManager is created but not yet used
- main.ts currently just re-exports script.ts
- No behavior changes - pure infrastructure setup
