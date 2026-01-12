# Implementation Plan: Webview Code Modularization

**Slug**: `sidecar-2025-12-08-webview-modularization`
**Created**: 2025-12-08
**Status**: Ready for Implementation

## Overview

Refactor the monolithic `script.ts` (2,896 lines) into a modular architecture with clear separation of concerns. The goal is to improve maintainability, testability, and developer experience while preserving all existing functionality.

## Technical Design

### Module Structure

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

### Architecture Principles

1. **Single Responsibility**: Each module handles one specific concern
2. **Dependency Flow**: `main.ts` → components → utils, no circular dependencies
3. **State Isolation**: All state managed through StateManager, no global variables
4. **Event Cleanup**: All event listeners use AbortController for proper cleanup
5. **Bundle Compatibility**: All modules bundle into single `dist/webview.js` via esbuild

### Key Design Decisions

#### 1. State Management

- **StateManager**: Centralized state with controlled mutations
- **Global Variables**: Migrated to StateManager properties
- **State Updates**: Components receive state, StateManager notifies on changes

Example state structure:
```typescript
interface WebviewState {
  // Selection state
  selectedLineNum: number | null;
  selectedLineElement: HTMLElement | null;
  selectionStartLine: number | null;
  selectionEndLine: number | null;
  isSelecting: boolean;

  // UI state
  isResizing: boolean;
  sidebarWidth: number;
  pendingScrollRestore: number | null;
  currentFile: string | null;

  // View state
  collapsedFolders: Set<string>;
  diffSearchMatches: any[];
  diffSearchCurrentIndex: number;
  scopedDiffHighlightMap: Map<number, string>;
}
```

#### 2. Component API Pattern

Each component exposes:
- **render()**: Main rendering function
- **setup()**: Event handler setup (using AbortController)
- **cleanup()**: Resource cleanup

Example:
```typescript
// components/sidebar/FileList.ts
export function renderFileList(state, signal) { ... }
export function setupFileListHandlers(signal) { ... }
```

#### 3. Event Handling

- Use `AbortController` for all event listeners
- Signal passed from main.ts to all components
- Cleanup on dispose message

#### 4. Build Integration

- esbuild bundles `main.ts` instead of `script.ts`
- All imports resolved at build time
- No runtime module loading needed

### Current Script.ts Function Map

| Lines | Area | Functions | Target Module |
|-------|------|-----------|---------------|
| 1-100 | Infrastructure | `resetAbortController()`, `getSignal()`, `addCollapsedFolder()`, sidebar toggle, resizer | `utils/events.ts`, `state/StateManager.ts` |
| 104-238 | File Search | Search input handlers, debouncing | `components/sidebar/FileList.ts` |
| 130-133 | View Mode Toggle | Tree/List toggle | `components/sidebar/FileList.ts` |
| 136-322 | Diff Search | `performDiffSearch()`, `highlightDiffMatches()`, `navigateDiffSearch()` | `components/diff/DiffSearch.ts` |
| 324-362 | Cleanup & Messages | `cleanup()`, message handler | `main.ts` |
| 365-452 | State Rendering | `renderState()`, `getScrollableElement()` | `main.ts`, `utils/scroll.ts` |
| 454-560 | File List | `renderFileList()` | `components/sidebar/FileList.ts` |
| 562-710 | Tree View | `buildFileTree()`, `renderTreeNode()`, `setupTreeHandlers()` | `components/sidebar/FileList.ts` |
| 712-846 | Comments | `renderComments()`, edit/delete handlers, `navigateToComment()` | `components/sidebar/Comments.ts` |
| 848-1003 | Inline Comments | `toggleInlineComment()`, edit handlers, `scrollToLineInDiff()` | `components/diff/InlineComments.ts` |
| 1005-1020 | AI Status | `renderAIStatus()` | `components/sidebar/AIStatus.ts` |
| 1022-1513 | Scoped Diff | `renderScopedDiff()`, scope tree, handlers | `components/diff/ScopedDiff.ts` |
| 1515-1622 | Diff Rendering | `renderDiff()`, chunk rendering | `components/diff/DiffViewer.ts` |
| 1624-2169 | Markdown | `renderMarkdown()`, `renderTable()`, inline processing | `components/diff/MarkdownPreview.ts` |
| 2171-2349 | Preview Comments | Preview comment handlers, selection | `components/diff/MarkdownPreview.ts` |
| 2351-2566 | Chunk Rendering | `renderChunksToHtml()`, line selection | `components/diff/DiffViewer.ts` |
| 2568-2762 | Inline Forms | `showInlineCommentForm()`, draft management | `components/diff/InlineComments.ts` |
| 2764-2769 | Utility | `escapeHtml()` | `utils/dom.ts` |
| 2771-2796 | Waiting Screen | `renderWaitingScreen()` | `components/waiting/WaitingScreen.ts` |
| 2798-2896 | HN Feed | `renderHNFeed()`, story rendering | `components/waiting/HNFeed.ts` |

## Migration Strategy

### Phase 1: Infrastructure Setup (Tasks 1-2)
- Create module structure
- Set up build configuration
- Create utility modules
- Create StateManager skeleton

### Phase 2: Utility Extraction (Task 3)
- Extract pure functions to utils/
- No behavior changes, just code movement
- Verify build and functionality

### Phase 3: Component Extraction (Tasks 4-13)
Extract one component at a time in dependency order:
1. HNFeed (least coupled)
2. WaitingScreen
3. AIStatus
4. DiffSearch
5. Comments
6. FileList
7. MarkdownPreview
8. ScopedDiff
9. InlineComments
10. DiffViewer

### Phase 4: State Migration (Task 14)
- Migrate global variables to StateManager
- Update components to use StateManager
- Test state synchronization

### Phase 5: Main Integration (Task 15)
- Complete main.ts orchestration
- Remove script.ts
- Final testing

### Phase 6: Cleanup (Task 16)
- Remove unused code
- Add JSDoc comments
- Optimize bundle

## Task Breakdown

| Task | Component | Estimated Time | Dependencies |
|------|-----------|----------------|--------------|
| 1 | Infrastructure Setup | 1-2 hours | None |
| 2 | Build Configuration | 30 min | Task 1 |
| 3 | Extract Utilities | 1 hour | Task 2 |
| 4 | Extract HNFeed | 1 hour | Task 3 |
| 5 | Extract WaitingScreen | 1 hour | Task 4 |
| 6 | Extract AIStatus | 30 min | Task 3 |
| 7 | Extract DiffSearch | 1-2 hours | Task 3 |
| 8 | Extract Comments | 1-2 hours | Task 3 |
| 9 | Extract FileList | 2 hours | Task 3 |
| 10 | Extract MarkdownPreview | 2-3 hours | Task 3 |
| 11 | Extract ScopedDiff | 2-3 hours | Task 3 |
| 12 | Extract InlineComments | 2 hours | Task 3 |
| 13 | Extract DiffViewer | 2-3 hours | Task 3 |
| 14 | Migrate State | 2 hours | Tasks 4-13 |
| 15 | Integrate Main | 1-2 hours | Task 14 |
| 16 | Cleanup & Optimization | 1 hour | Task 15 |

**Total Estimated Time**: 20-28 hours

## Testing Strategy

### For Each Task

1. **Build Test**: Verify extension builds successfully
2. **Functionality Test**: Manually test the specific feature
3. **Regression Test**: Test related features to ensure no breakage
4. **Visual Test**: Verify UI looks identical to before

### Key Test Scenarios

1. **File Selection**: Click files, verify diff renders
2. **Comment Operations**: Add, edit, delete comments
3. **Search**: File search, diff search
4. **View Modes**: Tree/List, Diff/Preview, Diff/Scope
5. **Line Selection**: Single line, multi-line, comment forms
6. **Scroll Restoration**: Switch files, verify scroll position preserved
7. **Draft Comments**: Start comment, switch files, verify draft persists
8. **HN Feed**: Load stories, click links, refresh

### Acceptance Criteria

- ✅ All existing features work identically
- ✅ No visual regressions
- ✅ Bundle size does not increase significantly (< 5%)
- ✅ No performance degradation
- ✅ All event listeners properly cleaned up on dispose
- ✅ No console errors or warnings
- ✅ Code is more maintainable (clear module boundaries)

## Rollback Plan

If issues are discovered:

1. **Revert commit**: Git revert to previous working state
2. **Incremental rollback**: If only specific component broken, revert that task
3. **Feature flag**: Add flag to switch between old and new implementation

## Future Improvements

After this refactoring, future work becomes easier:

1. **Unit Testing**: Each component can be tested in isolation
2. **Feature Addition**: New components don't require touching existing code
3. **Performance Optimization**: Profile and optimize individual components
4. **Type Safety**: Add stronger TypeScript types to component APIs
5. **CSS Modularization**: Apply same pattern to styles.ts

## Notes

- **No Framework**: This refactoring uses vanilla JS/TS, no UI frameworks
- **Bundle Constraint**: All code must bundle into single script for VSCode webview
- **Message Protocol**: No changes to extension ↔ webview message passing
- **Backwards Compatibility**: Existing state structure maintained for compatibility
