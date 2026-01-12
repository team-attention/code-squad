# Spec: Webview Code Modularization

**Slug**: `sidecar-2025-12-08-webview-modularization`
**Created**: 2025-12-08
**Status**: Draft

## Summary

Refactor the monolithic webview code (`script.ts`, 2,896 lines) into a modular, maintainable architecture using React-style component separation patterns without React itself. Split code by feature domain (file list, diff viewer, comments, etc.) and separate concerns (view rendering, state management, event handling) while maintaining the single-bundle constraint of VSCode webviews.

## Background

### Current State

The webview code is currently structured as follows:

| File | Lines | Responsibility |
|------|-------|----------------|
| `script.ts` | 2,896 | **All client-side logic** - state, rendering, events, utilities |
| `styles.ts` | 2,126 | All CSS styles |
| `html.ts` | 77 | Static HTML skeleton |
| `template.ts` | 25 | Assembles final HTML with styles and scripts |
| `webview-entry.ts` | 203 | Shiki syntax highlighter setup |
| `index.ts` | 5 | Export barrel |

**Total: ~5,332 lines**, with `script.ts` containing 54% of all webview code.

### Problem

The `script.ts` file is a 2,896-line monolith containing 80+ functions with tightly coupled responsibilities:

1. **Monolithic Structure**: All logic in a single file makes it difficult to locate, understand, or modify specific features
2. **Mixed Concerns**: View rendering, state management, event handling, and utilities are intermingled
3. **Scattered State**: 30+ global variables managing UI state, selection, scroll positions, caches, etc.
4. **Hard to Test**: No module boundaries means no unit testing capability
5. **Difficult to Extend**: Adding new features requires navigating and modifying a 3000-line file
6. **Code Navigation Issues**: Finding specific functionality requires extensive scrolling and searching

#### Major Functional Areas in script.ts

| Lines | Area | Key Functions |
|-------|------|---------------|
| 1-365 | Core Infrastructure | State vars, abort controller, sidebar toggle, resizer |
| 366-453 | State Management | `renderState()`, scroll position handling |
| 454-710 | File List Rendering | `renderFileList()`, tree building, file selection |
| 712-900 | Comments Sidebar | `renderComments()`, edit/delete handlers, navigation |
| 901-1022 | AI Status | `renderAIStatus()` |
| 1023-1514 | Scoped Diff | `renderScopedDiff()`, scope tree rendering |
| 1515-2170 | Unified Diff | `renderDiff()`, chunk rendering, line selection |
| 2171-2687 | Markdown Preview | `renderMarkdownPreview()`, inline processing |
| 2688-2764 | Draft Management | `saveDraftComment()`, `restoreDraftCommentForm()` |
| 2765-2900 | Waiting Screen & HN | `renderWaitingScreen()`, `renderHNFeed()` |

### User Pain Points

1. **Developer Onboarding**: New contributors need to understand 3000 lines of coupled code before making changes
2. **Feature Development**: Adding a new view type or component requires touching the monolithic file
3. **Bug Fixing**: Tracking down bugs requires navigating through unrelated code
4. **Code Review**: Large diffs spanning multiple functional areas are hard to review
5. **Testing**: No ability to test individual components in isolation

## Requirements

### Functional Requirements

1. **Preserve Existing Functionality**: All current features must work identically after refactoring
2. **Maintain Bundle Constraint**: Must compile to a single bundled script for VSCode webview
3. **Module Boundaries**: Clear separation between components, state, utilities
4. **Component Isolation**: Each component should be independently testable
5. **State Centralization**: Unified state management with controlled mutations

### Non-Functional Requirements

1. **Build System**: esbuild must bundle all modules into single output (`dist/webview.js`)
2. **Performance**: No performance degradation from modularization
3. **Developer Experience**: Clear file structure makes features easy to locate
4. **Backwards Compatibility**: No changes to extension-to-webview message protocol
5. **Maintainability**: New features can be added without touching unrelated code

## Terms

| Term | Definition |
|------|------------|
| **Component** | A self-contained module responsible for rendering a specific UI section (e.g., FileList, DiffViewer) |
| **State Manager** | Centralized module managing all webview state with controlled mutations |
| **View** | Pure function that takes data and returns HTML string (no side effects) |
| **Handler** | Event handler function attached to DOM elements |
| **Utility** | Pure helper function (DOM manipulation, formatting, validation) |
| **Module** | A TypeScript file exporting related functionality |
| **Bundle** | Single compiled JavaScript file containing all modules |

## Goals

1. **Separation of Concerns**: Split view logic, state management, and event handling
2. **Component Modularity**: Each UI section (file list, diff viewer, comments) is a separate module
3. **Testability**: Individual components can be unit tested in isolation
4. **Maintainability**: Developers can modify features without understanding entire codebase
5. **Scalability**: New components can be added easily without touching existing code
6. **Type Safety**: Strong TypeScript typing across all modules

## Non-Goals

1. **Framework Adoption**: Not introducing React, Vue, or any UI framework
2. **Build System Overhaul**: Continue using esbuild with minimal config changes
3. **Architecture Redesign**: Not changing clean architecture layers or message passing
4. **Style Refactoring**: CSS modularization is out of scope for this spec
5. **HTML Template Changes**: Static HTML structure remains the same

## Technical Approach

### Proposed Module Structure

```
src/adapters/inbound/ui/webview/
├── index.ts                    # Export barrel (unchanged)
├── template.ts                 # HTML assembly (unchanged)
├── html.ts                     # Base HTML (unchanged)
├── styles.ts                   # CSS (unchanged)
├── webview-entry.ts            # Shiki setup (unchanged)
│
├── state/
│   ├── index.ts                # State exports
│   ├── StateManager.ts         # Centralized state management
│   └── types.ts                # State type definitions
│
├── components/
│   ├── sidebar/
│   │   ├── FileList.ts         # File list rendering & tree building
│   │   ├── Comments.ts         # Comments list rendering
│   │   └── AIStatus.ts         # AI status indicator
│   │
│   ├── diff/
│   │   ├── DiffViewer.ts       # Unified diff rendering
│   │   ├── DiffSearch.ts       # Diff search functionality
│   │   ├── ScopedDiff.ts       # Scope-based diff rendering
│   │   ├── InlineComments.ts   # Inline comment forms
│   │   └── MarkdownPreview.ts  # Markdown preview rendering
│   │
│   └── waiting/
│       ├── WaitingScreen.ts    # Waiting screen
│       └── HNFeed.ts           # Hacker News feed
│
├── utils/
│   ├── dom.ts                  # DOM helpers (escapeHtml, element queries)
│   ├── events.ts               # Event handler utilities
│   ├── collections.ts          # Size-limited Set/Map
│   └── scroll.ts               # Scroll position management
│
└── main.ts                     # Entry point, orchestration
```

### Component Pattern (React-like without React)

Each component follows this pattern:

```typescript
// components/sidebar/FileList.ts

import { escapeHtml } from '../../utils/dom';
import type { FileItem, TreeNode } from '../../state/types';

export interface FileListProps {
  sessionFiles: FileItem[];
  uncommittedFiles: FileItem[];
  showUncommitted: boolean;
  selectedFile: string | null;
  isTreeView: boolean;
  searchQuery: string;
}

/**
 * Render file list component
 * Pure function: takes props, returns HTML string
 */
export function renderFileList(props: FileListProps): string {
  const { sessionFiles, uncommittedFiles, showUncommitted } = props;

  // Build data structure
  const allFiles = buildFileArray(sessionFiles, uncommittedFiles, showUncommitted);
  const filteredFiles = filterFiles(allFiles, props.searchQuery);

  // Render
  if (props.isTreeView) {
    return renderTreeView(filteredFiles, props.selectedFile);
  }
  return renderListView(filteredFiles, props.selectedFile);
}

/**
 * Attach event handlers for file list
 * Side effects: attaches listeners
 */
export function attachFileListHandlers(
  container: HTMLElement,
  onFileSelect: (file: string) => void,
  onTreeToggle: (path: string) => void
): void {
  // Event delegation
  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('tree-file')) {
      onFileSelect(target.dataset.file!);
    }
    if (target.classList.contains('tree-toggle')) {
      onTreeToggle(target.dataset.path!);
    }
  });
}

// Private helpers
function buildFileArray(/* ... */): FileItem[] { /* ... */ }
function filterFiles(/* ... */): FileItem[] { /* ... */ }
function renderTreeView(/* ... */): string { /* ... */ }
function renderListView(/* ... */): string { /* ... */ }
```

### State Management Pattern

```typescript
// state/StateManager.ts

import type { WebviewState } from './types';

export class StateManager {
  private state: WebviewState;
  private listeners: Set<(state: WebviewState) => void> = new Set();

  constructor(initialState: WebviewState) {
    this.state = initialState;
  }

  getState(): Readonly<WebviewState> {
    return Object.freeze({ ...this.state });
  }

  setState(updater: Partial<WebviewState> | ((prev: WebviewState) => Partial<WebviewState>)): void {
    const updates = typeof updater === 'function' ? updater(this.state) : updater;
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  subscribe(listener: (state: WebviewState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}
```

### Main Entry Point Pattern

```typescript
// main.ts

import { StateManager } from './state/StateManager';
import { renderFileList, attachFileListHandlers } from './components/sidebar/FileList';
import { renderDiffViewer, attachDiffHandlers } from './components/diff/DiffViewer';
// ... other imports

const vscode = acquireVsCodeApi();

// Initialize state manager
const stateManager = new StateManager({
  sessionFiles: [],
  selectedFile: null,
  // ... initial state
});

// Subscribe to state changes
stateManager.subscribe((state) => {
  // Re-render affected components
  updateUI(state);
});

// Handle messages from extension
window.addEventListener('message', (event) => {
  const { type, ...data } = event.data;

  switch (type) {
    case 'updateState':
      stateManager.setState(data);
      break;
    // ... other message types
  }
});

function updateUI(state: WebviewState): void {
  // Render file list
  const fileListContainer = document.getElementById('files-list')!;
  fileListContainer.innerHTML = renderFileList({
    sessionFiles: state.sessionFiles,
    uncommittedFiles: state.uncommittedFiles,
    // ... props
  });
  attachFileListHandlers(fileListContainer, onFileSelect, onTreeToggle);

  // Render diff viewer
  // ... similar pattern
}

// Event handler callbacks
function onFileSelect(file: string): void {
  vscode.postMessage({ type: 'selectFile', file });
}
```

### Build System Changes

**package.json** (no changes needed):
```json
{
  "scripts": {
    "esbuild-webview": "esbuild ./src/adapters/inbound/ui/webview/webview-entry.ts --bundle --outfile=dist/webview.js --format=iife --platform=browser --target=es2020"
  }
}
```

The entry point remains `webview-entry.ts`, which will now import from `main.ts`:

```typescript
// webview-entry.ts (modified)

// Existing Shiki setup
import { createHighlighterCore, ... } from 'shiki/core';
// ... existing highlighter code

// NEW: Import main application
import './main';
```

esbuild will automatically bundle all imports into a single `dist/webview.js` file.

## Migration Strategy

### Phase 1: Infrastructure Setup
**Goal**: Create module structure without breaking existing code

1. Create directory structure:
   - `state/`, `components/`, `utils/`
2. Create `StateManager.ts` with initial state types
3. Create utility modules (`dom.ts`, `events.ts`, `collections.ts`)
4. Create `main.ts` entry point (empty initially)
5. **Test**: Verify build still works, no functionality broken

### Phase 2: Extract Utilities
**Goal**: Move pure functions first (low risk)

1. Extract to `utils/dom.ts`:
   - `escapeHtml()`
   - DOM query helpers
2. Extract to `utils/collections.ts`:
   - Size-limited `Set` and `Map` implementations
3. Extract to `utils/scroll.ts`:
   - `saveScrollPosition()`
   - `getScrollableElement()`
4. **Test**: Run extension, verify all utilities work

### Phase 3: Component Extraction (Incremental)
**Goal**: Extract one component at a time, test thoroughly

Extract components in this order (lowest to highest risk):

1. **HNFeed** (least coupled)
   - `components/waiting/HNFeed.ts`
   - `renderHNFeed()`, `attachHNFeedHandlers()`
2. **WaitingScreen**
   - `components/waiting/WaitingScreen.ts`
3. **AIStatus**
   - `components/sidebar/AIStatus.ts`
4. **Comments**
   - `components/sidebar/Comments.ts`
5. **FileList**
   - `components/sidebar/FileList.ts`
6. **MarkdownPreview**
   - `components/diff/MarkdownPreview.ts`
7. **ScopedDiff**
   - `components/diff/ScopedDiff.ts`
8. **DiffViewer** (most complex)
   - `components/diff/DiffViewer.ts`
9. **InlineComments**
   - `components/diff/InlineComments.ts`
10. **DiffSearch**
    - `components/diff/DiffSearch.ts`

**Per-component workflow**:
1. Create component file with `render()` and `attachHandlers()` functions
2. Move related functions from `script.ts`
3. Update imports in `main.ts`
4. Delete old code from `script.ts`
5. **Test thoroughly**: Manual testing + verify no console errors

### Phase 4: State Migration
**Goal**: Replace global state with StateManager

1. Identify all global state variables in current `script.ts`
2. Define state types in `state/types.ts`
3. Migrate state one section at a time:
   - UI state (sidebar, resizer, selection)
   - File list state
   - Diff state
   - Comments state
4. Replace direct state mutations with `stateManager.setState()`
5. **Test**: Verify state updates trigger correct re-renders

### Phase 5: Main Integration
**Goal**: Complete migration to modular architecture

1. Move all component rendering to `main.ts`
2. Wire up event handlers through `main.ts`
3. Remove empty `script.ts` (or keep as legacy import for safety)
4. **Test**: Full regression testing of all features

### Phase 6: Cleanup
**Goal**: Remove legacy code and optimize

1. Delete `script.ts` if empty
2. Remove unused imports
3. Optimize bundle size (tree shaking)
4. Add JSDoc comments to public APIs
5. **Test**: Final verification

### Risk Mitigation

1. **Incremental Migration**: Each phase is independently testable and releasable
2. **Backward Compatibility**: Keep old code until new code is verified working
3. **Feature Flags**: If needed, use message type to enable/disable new components
4. **Rollback Plan**: Each phase is a separate commit, easy to revert
5. **Testing Checklist**: Manual test all features after each component extraction

## Success Criteria

### Code Quality Metrics
- ✅ No single file exceeds 500 lines (except generated code)
- ✅ All components have clear, single responsibilities
- ✅ State management is centralized in `StateManager`
- ✅ Zero global variables (except `vscode` API and `StateManager` instance)
- ✅ All utility functions are pure (no side effects)

### Functional Validation
- ✅ All existing features work identically to before refactoring
- ✅ No console errors or warnings
- ✅ No memory leaks (verify with Chrome DevTools)
- ✅ Performance is equal to or better than before (no user-visible slowdown)

### Developer Experience
- ✅ New developer can locate file list code in <30 seconds
- ✅ Adding a new component requires touching <3 files
- ✅ Components can be unit tested in isolation
- ✅ Build time remains under 5 seconds

### Maintainability
- ✅ Each component has clear JSDoc documentation
- ✅ File structure is self-documenting (name → functionality mapping)
- ✅ Adding new view type (e.g., "Image Diff") requires only creating new component file

## References

### Existing Code
- `/Users/eatnug/Workspace/sidecar/src/adapters/inbound/ui/webview/script.ts` (current monolith)
- `/Users/eatnug/Workspace/sidecar/src/adapters/inbound/ui/webview/template.ts` (build integration)
- `/Users/eatnug/Workspace/sidecar/package.json` (esbuild configuration)

### Related Specs
- `sidecar-2025-12-07-memory-optimization.md` (state management considerations)
- `sidecar-2025-12-06-scope-based-diff.md` (ScopedDiff component complexity)

### Design Patterns
- **Component Pattern**: Inspired by React components (render + handlers separation)
- **State Management**: Redux-like centralized state with immutable updates
- **Module Pattern**: ES6 modules with clear exports
- **Observer Pattern**: StateManager subscription system

### External References
- [VSCode Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [esbuild Bundling](https://esbuild.github.io/api/#bundle)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
