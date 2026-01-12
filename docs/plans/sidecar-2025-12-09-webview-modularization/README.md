# Webview Script Modularization - Implementation Plan (Phase 2)

This directory contains the implementation plan for completing the modularization of the webview script. This is a continuation of `sidecar-2025-12-08-webview-modularization` which established the infrastructure.

## Plan Structure

- **main.md** - Overview, technical design, and task list
- **task-1.md** through **task-13.md** - Detailed implementation guides for each component
- **tasks-14-16-summary.md** - Integration and cleanup tasks
- **README.md** - This file

## Quick Start

1. Read `main.md` for the complete overview
2. Tasks 1-6 from previous plan are complete (infrastructure)
3. Start with Task 1 (FileSearch) - simplest component
4. Follow tasks in order - each builds on previous
5. Run `npm run compile` and test after each task

## Task Overview

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

## Key Principles

1. **Incremental Migration** - Each task is independently testable
2. **No Framework** - Vanilla TypeScript, no React/Vue
3. **Bundle Compatibility** - All code bundles into single script
4. **Zero Breaking Changes** - Preserve all existing functionality
5. **Type Safety** - Strong TypeScript types throughout

## Component Pattern

Each component exports:
- `render*()` - Pure rendering function returning HTML string
- `setup*Handlers()` - Event handler setup with AbortSignal for cleanup

Example:
```typescript
export function renderFileSearch(query: string): string {
  return `<input value="${escapeHtml(query)}" />`;
}

export function setupFileSearchHandlers(
  handlers: { onSearch: (q: string) => void },
  signal: AbortSignal
): void {
  // Event delegation with cleanup
}
```

## Final Structure

```
src/adapters/inbound/ui/webview/
├── state/              # State management
├── utils/              # Pure utilities
├── components/
│   ├── sidebar/       # FileList, Comments, AIStatus, Sidebar, FileSearch
│   ├── diff/          # DiffViewer, ChunkRenderer, ScopedDiff, etc.
│   ├── markdown/      # MarkdownPreview, PreviewComments
│   ├── waiting/       # WaitingScreen, HNFeed
│   └── content/       # ContentView
└── main.ts            # Entry point, orchestration
```

## Testing Strategy

Each task includes:
- **Build Tests**: `npm run compile` succeeds
- **Lint Tests**: `npm run lint` passes
- **Functionality Tests**: Feature works as before
- **Regression Tests**: Related features unaffected

## Success Criteria

- No file exceeds 500 lines
- Zero global variables (except `vscode`)
- All exports have TypeScript types
- No circular dependencies
- All features work identically
- Bundle size < 5% increase

## Getting Help

- **Architecture**: See `main.md` Technical Design
- **Task Details**: See individual task files
- **Previous Work**: See `../sidecar-2025-12-08-webview-modularization/`

## Next Step

```
/implement sidecar-2025-12-09-webview-modularization
```
