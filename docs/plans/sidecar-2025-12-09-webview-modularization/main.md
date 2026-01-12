# Implementation Plan: Webview Script Modularization (Phase 2)

**Slug**: `sidecar-2025-12-09-webview-modularization`
**Created**: 2025-12-09
**Status**: Ready for Implementation

## Overview

Continue modularization of `script.ts` (3,097 lines) by extracting remaining components into focused modules. Tasks 1-6 from the previous plan (`sidecar-2025-12-08-webview-modularization`) are complete. This plan covers extracting 13 remaining components and integrating them into the main orchestrator.

## Current State

### Completed (Previous Plan Tasks 1-6)

```
src/adapters/inbound/ui/webview/
├── state/
│   ├── index.ts            # State exports
│   ├── StateManager.ts     # Centralized state with getters/setters
│   └── types.ts            # SelectionState, UIState, SearchState, ViewState
│
├── utils/
│   ├── dom.ts              # escapeHtml, getElementById, querySelector
│   ├── events.ts           # AbortController management (getSignal)
│   ├── collections.ts      # SizeLimitedSet, SizeLimitedMap
│   └── scroll.ts           # getScrollableElement, save/restore scroll
│
├── components/
│   ├── sidebar/
│   │   └── AIStatus.ts     # renderAIStatus
│   ├── waiting/
│   │   ├── HNFeed.ts       # renderHNFeed, setupHNFeedHandlers
│   │   └── WaitingScreen.ts # renderWaitingScreen
│   └── content/
│       └── ContentView.ts  # renderContentView, renderContentViewHeader
│
└── script.ts               # Still 3,097 lines
```

### Remaining to Extract

| Component | Lines in script.ts | Complexity |
|-----------|-------------------|------------|
| FileSearch | 141-170 | Low |
| Sidebar | 81-140 | Low |
| Comments | 754-940 | Medium |
| FileList | 496-752 | Medium |
| DiffSearch | 172-360 | Medium |
| DiffHeader | (in renderDiff) | Low |
| LineSelection | 2568-2677 | Medium |
| InlineComments | 890-940, 2678-2810 | Medium |
| ChunkRenderer | 2399-2567 | High |
| ScopedDiff | 1064-1558 | High |
| DiffViewer | 1560-1670 | High |
| PreviewComments | 2223-2398 | Medium |
| MarkdownPreview | 1672-2037 | High |

## Technical Design

### Component Pattern

Each component follows the established pattern:

```typescript
// Example: components/sidebar/FileSearch.ts

export interface FileSearchHandlers {
  onSearchQueryChange: (query: string) => void;
}

export function renderFileSearch(searchQuery: string): string {
  return `...`;
}

export function setupFileSearchHandlers(
  handlers: FileSearchHandlers,
  signal: AbortSignal
): void {
  // Event setup with signal for cleanup
}
```

### Dependency Graph

```
                     main.ts
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
     Sidebar        DiffViewer    MarkdownPreview
         │              │              │
    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
    ▼         ▼    ▼         ▼    ▼         ▼
FileSearch FileList ChunkRenderer ScopedDiff PreviewComments
    │         │         │             │           │
    └────┬────┘    ┌────┴────┐        │           │
         ▼         ▼         ▼        │           │
      Comments  LineSelection InlineComments      │
                     │                │           │
                     └────────────────┴───────────┘
                              │
                         state/, utils/
```

## Task List

### Phase 2: Simple Components (Low coupling)

| Task | Component | File | Time |
|------|-----------|------|------|
| 1 | FileSearch | `components/sidebar/FileSearch.ts` | 30 min |
| 2 | Sidebar | `components/sidebar/Sidebar.ts` | 45 min |

### Phase 3: Sidebar Components (Medium coupling)

| Task | Component | File | Time |
|------|-----------|------|------|
| 3 | Comments | `components/sidebar/Comments.ts` | 1 hour |
| 4 | FileList | `components/sidebar/FileList.ts` | 1.5 hours |

### Phase 4: Diff Components (High coupling)

| Task | Component | File | Time |
|------|-----------|------|------|
| 5 | DiffSearch | `components/diff/DiffSearch.ts` | 1 hour |
| 6 | DiffHeader | `components/diff/DiffHeader.ts` | 30 min |
| 7 | LineSelection | `components/diff/LineSelection.ts` | 1 hour |
| 8 | InlineComments | `components/diff/InlineComments.ts` | 1.5 hours |
| 9 | ChunkRenderer | `components/diff/ChunkRenderer.ts` | 2 hours |
| 10 | ScopedDiff | `components/diff/ScopedDiff.ts` | 2.5 hours |
| 11 | DiffViewer | `components/diff/DiffViewer.ts` | 1.5 hours |

### Phase 5: Markdown Components

| Task | Component | File | Time |
|------|-----------|------|------|
| 12 | PreviewComments | `components/markdown/PreviewComments.ts` | 1 hour |
| 13 | MarkdownPreview | `components/markdown/MarkdownPreview.ts` | 2 hours |

### Phase 6: Integration

| Task | Description | Time |
|------|-------------|------|
| 14 | State Migration | 1.5 hours |
| 15 | Main Integration | 2 hours |
| 16 | Cleanup & Verification | 1 hour |

**Total**: ~18-20 hours

## Testing Strategy

### Per-Task Verification

1. **Build Test**: `npm run compile` succeeds
2. **Lint Test**: `npm run lint` passes
3. **Manual Test**: Feature works in extension
4. **Regression Test**: Related features unaffected

### Key Test Scenarios

| Scenario | Components |
|----------|-----------|
| File selection (list/tree) | FileList, Sidebar |
| File search | FileSearch, FileList |
| Comment add/edit/delete | Comments, InlineComments |
| Diff search | DiffSearch |
| Scope view toggle | ScopedDiff, DiffViewer |
| Markdown preview | MarkdownPreview, PreviewComments |
| Sidebar resize | Sidebar |

## Success Criteria

**Code Quality**:
- No file exceeds 500 lines
- Zero global variables (except `vscode`)
- All exports have TypeScript types
- No circular dependencies

**Functionality**:
- All features work identically
- No new console errors
- No performance regressions

**Developer Experience**:
- File location obvious from functionality
- Components testable in isolation
- Adding new component requires touching <3 files
