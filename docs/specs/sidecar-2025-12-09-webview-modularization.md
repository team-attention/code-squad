# Spec: Webview Script Modularization

**Slug**: `sidecar-2025-12-09-webview-modularization`
**Created**: 2025-12-09
**Status**: Draft

## Summary

Modularize the monolithic `script.ts` (3,097 lines) by extracting functional areas into focused modules while maintaining the single-bundle constraint for VSCode webviews. This spec focuses on practical extraction patterns and incremental migration strategy.

## Background

### Current State

The webview script (`src/adapters/inbound/ui/webview/script.ts`) has grown to 3,097 lines containing all client-side logic as a single template string. This creates significant maintainability challenges:

**File Structure:**
```
src/adapters/inbound/ui/webview/
├── script.ts          # 3,097 lines - all logic
├── main.ts            # 13 lines - re-exports script.ts
├── template.ts        # 25 lines - assembles HTML
├── html.ts            # 77 lines - static HTML
├── styles.ts          # 2,126 lines - all CSS
├── webview-entry.ts   # 203 lines - Shiki setup
└── index.ts           # 5 lines - exports
```

**Major Functional Areas in script.ts:**

| Lines | Component | Responsibilities |
|-------|-----------|------------------|
| 1-80 | Core/State | AbortController, constants, UI state (20+ global vars) |
| 81-140 | Sidebar | Toggle/collapse, panel resizer |
| 141-170 | File Search | Search input, debounce, filtering |
| 172-360 | Diff Search | In-diff search, highlighting |
| 361-495 | State Rendering | Main render orchestrator |
| 496-752 | File List | Tree/list views, file selection |
| 754-940 | Comments Sidebar | Comment list, edit/delete/navigate |
| 941-1063 | AI Status | AI session status display |
| 1064-1558 | Scoped Diff | Scope-based diff view, tree rendering |
| 1560-1670 | Diff Rendering | Unified diff, header, stats |
| 1672-2037 | Markdown | Markdown preview with syntax highlighting |
| 2038-2222 | Comment Forms | Inline comment forms, draft management |
| 2223-2398 | Preview Comments | Preview mode comment rendering |
| 2399-2810 | Chunk Rendering | Chunk rendering, line selection, inline comments |
| 2819-2960 | HN Feed | Hacker News feed for waiting screen |
| 2961-3097 | Content View | External content iframe view |

### Problems

1. **Discoverability**: Finding specific functionality requires scrolling through 3000+ lines
2. **Change Impact**: Modifications often require understanding unrelated code sections
3. **Testing**: No module boundaries prevent unit testing
4. **Code Review**: Large PRs with mixed concerns are difficult to review
5. **Onboarding**: New contributors face steep learning curve
6. **Coupling**: Functions reference global state and each other freely

### Related Work

This spec builds on `sidecar-2025-12-08-webview-modularization.md` which established the component-based architecture pattern. This spec provides concrete implementation guidance for the migration.

## Goals

1. **Extract 13 focused modules** from the monolithic script
2. **Eliminate global state** by introducing centralized state management
3. **Enable unit testing** through clear module boundaries
4. **Improve discoverability** with self-documenting file structure
5. **Maintain functionality** - zero behavior changes during migration
6. **Keep single-bundle build** - no changes to build process

## Non-Goals

1. **UI Framework Adoption**: Not introducing React, Vue, or any framework
2. **CSS Modularization**: Styles remain in single file
3. **HTML Restructuring**: Base HTML structure unchanged
4. **Protocol Changes**: Extension-to-webview messages unchanged
5. **Build System Overhaul**: Continue using existing esbuild setup
6. **Performance Optimization**: Focus is on structure, not speed

## Terms

| Term | Definition |
|------|------------|
| **Module** | Self-contained TypeScript file with focused responsibility |
| **Component** | Module that renders UI (exports `render()` function) |
| **State Manager** | Centralized state container with subscription pattern |
| **Pure Function** | Function with no side effects (deterministic output) |
| **Handler** | Event handler function attached to DOM elements |
| **Template String** | JavaScript string for webview (all code must be browser-compatible) |

## Use Cases

### UC1: Extract Component Module

**Actor**: Developer
**Trigger**: Need to modify or understand a specific UI component
**Flow**:
1. Identify component boundaries in `script.ts`
2. Create new module file in `components/` directory
3. Extract render function and related utilities
4. Export `render()` and `attachHandlers()` functions
5. Import and wire into `main.ts`
6. Remove extracted code from `script.ts`
7. Test component in isolation

**Business Rules**:
- Component must be self-contained (minimal external dependencies)
- Export must be browser-compatible (no Node.js APIs)
- Template string format must be preserved

**Location**: All modules in `src/adapters/inbound/ui/webview/`

### UC2: Migrate Global State to State Manager

**Actor**: Developer
**Trigger**: Need predictable state management and debugging
**Flow**:
1. Identify global state variables
2. Define state shape in `state/types.ts`
3. Create `StateManager` instance in `main.ts`
4. Replace direct state access with `stateManager.getState()`
5. Replace state mutations with `stateManager.setState()`
6. Subscribe components to state changes
7. Remove global variables

**Business Rules**:
- State updates must be immutable
- State manager is singleton per webview instance
- All state changes trigger re-renders of affected components

**Location**: `src/adapters/inbound/ui/webview/state/`

### UC3: Add New UI Component

**Actor**: Developer
**Trigger**: New feature requires new UI element
**Flow**:
1. Create component file in appropriate directory
2. Define component props interface
3. Implement `render(props)` function
4. Implement `attachHandlers()` if needed
5. Import in `main.ts`
6. Wire component into render cycle
7. Add to state type if needed

**Business Rules**:
- Component follows established pattern (render + handlers)
- Props are type-safe interfaces
- No direct DOM manipulation in render function
- Handlers are event-delegated where possible

**Location**: New component file in `components/` subdirectory

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
│   ├── StateManager.ts         # Centralized state with subscriptions
│   ├── types.ts                # State shape definitions
│   └── initialState.ts         # Default state factory
│
├── core/
│   ├── abort.ts                # AbortController utilities
│   ├── constants.ts            # MAX_* limits, config
│   └── vscode.ts               # VSCode API wrapper
│
├── utils/
│   ├── dom.ts                  # escapeHtml, query helpers
│   ├── collections.ts          # Size-limited Set/Map
│   ├── scroll.ts               # Scroll position utilities
│   └── debounce.ts             # Debounce utility
│
├── components/
│   ├── sidebar/
│   │   ├── Sidebar.ts          # Sidebar toggle & resize
│   │   ├── FileList.ts         # File list & tree view
│   │   ├── FileSearch.ts       # File search input
│   │   ├── Comments.ts         # Comments list
│   │   └── AIStatus.ts         # AI status indicator
│   │
│   ├── diff/
│   │   ├── DiffViewer.ts       # Main diff rendering
│   │   ├── DiffSearch.ts       # In-diff search
│   │   ├── DiffHeader.ts       # Header & stats
│   │   ├── ScopedDiff.ts       # Scope-based view
│   │   ├── ChunkRenderer.ts    # Chunk rendering
│   │   ├── LineSelection.ts    # Line selection logic
│   │   └── InlineComments.ts   # Inline comment forms
│   │
│   ├── markdown/
│   │   ├── MarkdownPreview.ts  # Markdown rendering
│   │   └── PreviewComments.ts  # Preview mode comments
│   │
│   ├── waiting/
│   │   ├── HNFeed.ts           # Hacker News feed
│   │   └── WaitingScreen.ts    # Waiting screen
│   │
│   └── content/
│       └── ContentView.ts      # External content iframe
│
└── main.ts                     # Entry point, orchestration
```

**Total Modules**: 28 files (including index/types)
**Average Size**: ~110 lines per module (3097 / 28)
**Max Size Target**: 300 lines per module

### Component Pattern

Each component exports a consistent API:

```typescript
// components/sidebar/FileList.ts

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
 * @returns HTML string for file list
 */
export function renderFileList(props: FileListProps): string {
  // Pure rendering logic
  return html;
}

/**
 * Attach event handlers to file list
 * @param container - Container element
 * @param handlers - Event handler callbacks
 * @returns Cleanup function to remove all handlers
 */
export function attachFileListHandlers(
  container: HTMLElement,
  handlers: {
    onFileSelect: (file: string) => void;
    onTreeToggle: (path: string) => void;
  }
): () => void {
  const controller = new AbortController();
  // Event delegation with abort signal
  container.addEventListener('click', (e) => {...}, { signal: controller.signal });
  // Return cleanup function
  return () => controller.abort();
}
```

### State Management Pattern

```typescript
// state/StateManager.ts

export class StateManager {
  private state: WebviewState;
  private listeners: Set<(state: WebviewState) => void> = new Set();

  constructor(initialState: WebviewState) {
    this.state = initialState;
  }

  getState(): Readonly<WebviewState> {
    return Object.freeze({ ...this.state });
  }

  setState(updates: Partial<WebviewState>): void {
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
import { createInitialState } from './state/initialState';
import { setupAbortController, getSignal } from './core/abort';
import { renderFileList, attachFileListHandlers } from './components/sidebar/FileList';
// ... other imports

const vscode = acquireVsCodeApi();

// Initialize state
const stateManager = new StateManager(createInitialState());

// Setup abort controller for cleanup
setupAbortController();

// Subscribe to state changes
stateManager.subscribe((state) => {
  updateUI(state);
});

// Message handler
window.addEventListener('message', (event) => {
  const { type, ...data } = event.data;

  switch (type) {
    case 'updateState':
      stateManager.setState(data);
      break;
    case 'renderDiff':
      // Handle specific renders
      break;
  }
}, { signal: getSignal() });

// Cleanup registry for handlers
const cleanupFns: Map<string, () => void> = new Map();

// UI update function
function updateUI(state: WebviewState): void {
  const fileListEl = document.getElementById('files-list');
  if (fileListEl) {
    // Cleanup previous handlers before re-rendering
    cleanupFns.get('fileList')?.();

    fileListEl.innerHTML = renderFileList({
      sessionFiles: state.sessionFiles,
      uncommittedFiles: state.uncommittedFiles,
      showUncommitted: state.showUncommitted,
      selectedFile: state.selectedFile,
      isTreeView: state.isTreeView,
      searchQuery: state.fileSearchQuery,
    });

    // Attach new handlers and store cleanup function
    const cleanup = attachFileListHandlers(fileListEl, {
      onFileSelect: (file) => {
        vscode.postMessage({ type: 'selectFile', file });
      },
      onTreeToggle: (path) => {
        // Handle tree toggle
      },
    });
    cleanupFns.set('fileList', cleanup);
  }

  // ... other components (same pattern)
}

// Global cleanup on dispose
window.addEventListener('message', (event) => {
  if (event.data.type === 'dispose') {
    cleanupFns.forEach(fn => fn());
    cleanupFns.clear();
  }
}, { signal: getSignal() });
```

### Build Integration

**No changes required to `package.json` or build scripts.**

The entry point remains `webview-entry.ts`, which imports `main.ts`:

```typescript
// webview-entry.ts (add one line)

// Existing Shiki setup
import { createHighlighterCore, ... } from 'shiki/core';
// ... existing highlighter code

// NEW: Import main application
import './main';
```

esbuild automatically bundles all imports into `dist/webview.js`.

## File Structure

### Module Extraction Priority

**Phase 1 - Infrastructure** (Low risk, high value):
1. `core/abort.ts` - AbortController utilities
2. `core/constants.ts` - Constants and limits
3. `utils/dom.ts` - DOM utilities
4. `utils/collections.ts` - Size-limited collections
5. `utils/scroll.ts` - Scroll utilities
6. `utils/debounce.ts` - Debounce function
7. `state/types.ts` - State types
8. `state/StateManager.ts` - State manager
9. `state/initialState.ts` - Initial state factory

**Phase 2 - Simple Components** (Low coupling):
10. `components/waiting/HNFeed.ts` - HN feed (self-contained)
11. `components/waiting/WaitingScreen.ts` - Waiting screen
12. `components/sidebar/AIStatus.ts` - AI status
13. `components/content/ContentView.ts` - Content view

**Phase 3 - Sidebar Components** (Medium coupling):
14. `components/sidebar/FileSearch.ts` - File search
15. `components/sidebar/Sidebar.ts` - Sidebar toggle/resize
16. `components/sidebar/Comments.ts` - Comments list
17. `components/sidebar/FileList.ts` - File list

**Phase 4 - Diff Components** (High coupling):
18. `components/diff/DiffHeader.ts` - Diff header
19. `components/diff/DiffSearch.ts` - Diff search
20. `components/diff/LineSelection.ts` - Line selection
21. `components/diff/InlineComments.ts` - Inline comments
22. `components/diff/ChunkRenderer.ts` - Chunk rendering
23. `components/diff/ScopedDiff.ts` - Scoped diff
24. `components/diff/DiffViewer.ts` - Main diff orchestrator

**Phase 5 - Markdown Components**:
25. `components/markdown/PreviewComments.ts` - Preview comments
26. `components/markdown/MarkdownPreview.ts` - Markdown rendering

**Phase 6 - Integration**:
27. `main.ts` - Main orchestrator
28. Update `webview-entry.ts` - Wire main.ts

## Dependencies

### Internal
- Existing VSCode webview API integration
- Existing message protocol between extension and webview
- esbuild bundler configuration

### External
- None (all dependencies already exist in current implementation)

## Open Questions

1. **State granularity**: Should state be split into domain slices (file state, diff state, etc.) or remain flat?
   - **Proposal**: Start flat, refactor to slices if needed

2. **Event delegation strategy**: Use single root listener or component-level listeners?
   - **Proposal**: Component-level with abort controller for cleanup

3. **Render optimization**: Re-render entire component or use virtual DOM diffing?
   - **Proposal**: Full re-render for simplicity (current behavior)
   - **Virtual DOM Pro/Con**:
     | Aspect | Full Re-render | Virtual DOM Diffing |
     |--------|----------------|---------------------|
     | Pros | Simple, easy to debug, fewer bugs | Minimal DOM changes, preserves scroll/focus |
     | Cons | Loses scroll/focus, unnecessary DOM ops | Complex, larger bundle, new bug surface |
   - Current code already has manual scroll position saving (`saveScrollPosition`, `pendingScrollRestore`)
   - **Decision**: Keep full re-render; consider lightweight diffing (morphdom ~2KB) if perf issues arise

4. **Type generation**: Generate types from state shape or maintain manually?
   - **Proposal**: Manual for now
   - **Why avoid codegen**: Adds build step, extra dependencies, harder debugging (generated types less readable), IDE issues before generation runs
   - State shape rarely changes; TypeScript inference is sufficient

5. **Testing strategy**: Unit tests for pure functions or E2E tests only?
   - **Proposal**: Unit tests for utilities, manual E2E for components

## Migration Strategy

### Per-Component Workflow

For each component extraction:

1. **Identify boundaries**: Mark start/end lines in `script.ts`
2. **Create module file**: Use appropriate directory in `components/`
3. **Extract code**: Copy functions to new module
4. **Add exports**: Export `render()` and `attachHandlers()`
5. **Update imports**: Import in `main.ts`
6. **Wire component**: Add to render cycle
7. **Test**: Manual verification in extension
8. **Delete old code**: Remove from `script.ts`
9. **Commit**: Single commit per component

### Testing Checklist (per component)

- [ ] Extension builds without errors
- [ ] Webview loads without console errors
- [ ] Component renders correctly
- [ ] Event handlers work as expected
- [ ] State updates trigger re-renders
- [ ] No memory leaks (verify with DevTools)

### Rollback Plan

Each component extraction is a separate commit. If issues arise:
1. Revert the specific commit
2. Fix issues in feature branch
3. Re-merge when stable

### Success Metrics

**Code Quality**:
- ✅ No file exceeds 500 lines
- ✅ Zero global variables (except `vscode`, `stateManager`)
- ✅ All exports have TypeScript types
- ✅ No circular dependencies

**Functionality**:
- ✅ All features work identically
- ✅ No new console errors
- ✅ No performance regressions
- ✅ Build time under 5 seconds

**Developer Experience**:
- ✅ File location is obvious from functionality
- ✅ Components can be tested in isolation
- ✅ Adding new component requires touching <3 files
- ✅ Build process unchanged

## References

### Existing Code
- `/Users/eatnug/Workspace/sidecar/src/adapters/inbound/ui/webview/script.ts` - Current monolith
- `/Users/eatnug/Workspace/sidecar/src/adapters/inbound/ui/webview/main.ts` - Future entry point
- `/Users/eatnug/Workspace/sidecar/src/adapters/inbound/ui/webview/template.ts` - Build integration

### Related Specs
- `sidecar-2025-12-08-webview-modularization.md` - Original modularization spec
- `sidecar-2025-12-07-memory-optimization.md` - State management patterns
- `sidecar-2025-12-06-scope-based-diff.md` - Scoped diff complexity

### Architecture
- `/Users/eatnug/Workspace/sidecar/docs/overview.md` - Project architecture
- `/Users/eatnug/Workspace/sidecar/CLAUDE.md` - Development guidelines
