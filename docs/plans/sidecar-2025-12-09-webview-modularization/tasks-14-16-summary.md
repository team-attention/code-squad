# Tasks 14-16: Integration and Cleanup

This document summarizes the final integration tasks that complete the modularization.

---

## Task 14: State Migration

**Time**: 1.5 hours
**Dependencies**: Tasks 1-13

### Objective

Migrate all remaining global variables in `script.ts` to the StateManager, ensuring all components use centralized state.

### Global Variables to Migrate

```typescript
// Selection state (currently inline)
selectedLineNum        -> stateManager.setSelection({ selectedLineNum: ... })
selectedLineElement    -> stateManager.setSelection({ selectedLineElement: ... })
selectionStartLine     -> stateManager.setSelection({ selectionStartLine: ... })
selectionEndLine       -> stateManager.setSelection({ selectionEndLine: ... })
isSelecting            -> stateManager.setSelection({ isSelecting: ... })

// UI state
isResizing             -> stateManager.setUI({ isResizing: ... })
sidebarWidth           -> stateManager.setUI({ sidebarWidth: ... })
pendingScrollRestore   -> stateManager.setUI({ pendingScrollRestore: ... })
currentFile            -> stateManager.setUI({ currentFile: ... })

// Search state
currentSearchQuery     -> stateManager.setSearch({ currentSearchQuery: ... })
diffSearchQuery        -> stateManager.setSearch({ diffSearchQuery: ... })
diffSearchMatches      -> stateManager.setSearch({ diffSearchMatches: ... })
diffSearchCurrentIndex -> stateManager.setSearch({ diffSearchCurrentIndex: ... })

// View state
collapsedFolders       -> stateManager.setView({ collapsedFolders: ... })
collapsedChunks        -> stateManager.setView({ collapsedChunks: ... })
collapsedScopes        -> stateManager.setView({ collapsedScopes: ... })
scopedDiffHighlightMap -> stateManager.setView({ scopedDiffHighlightMap: ... })
```

### Changes Required

1. **Update StateManager** - Add any missing state slices
2. **Update Components** - Replace direct state access with stateManager calls
3. **Update Event Handlers** - Use stateManager for mutations
4. **Add Reset** - Ensure `cleanup()` calls `stateManager.reset()`

### Test Scenarios

- **TS1**: State persists across renders
- **TS2**: State resets on cleanup
- **TS3**: Components receive correct state
- **TS4**: State mutations trigger re-renders

### Acceptance Criteria

- [ ] No global variables in script.ts (except `vscode`)
- [ ] All state in StateManager
- [ ] Cleanup resets all state
- [ ] No memory leaks

---

## Task 15: Main Integration

**Time**: 2 hours
**Dependencies**: Task 14

### Objective

Replace `script.ts` content with imports from all extracted modules. The `main.ts` becomes the true entry point that orchestrates all components.

### Changes

1. **Move vscode acquisition** to main.ts
2. **Move message handler** to main.ts
3. **Move renderState** to main.ts (compose from components)
4. **Import all components** in main.ts
5. **Wire handlers** for all components
6. **Delete script.ts content** (keep as shell for compatibility)

### main.ts Structure

```typescript
// main.ts
import { StateManager, createInitialState } from './state';
import { setupAbortController, getSignal } from './utils/events';
import { escapeHtml } from './utils/dom';

// Import all components
import { renderFileList, setupTreeHandlers } from './components/sidebar/FileList';
import { renderComments, setupCommentHandlers } from './components/sidebar/Comments';
import { renderDiff } from './components/diff/DiffViewer';
// ... more imports

const vscode = acquireVsCodeApi();
const stateManager = new StateManager(createInitialState());

// Message handler
window.addEventListener('message', (event) => {
  const { type, ...data } = event.data;

  switch (type) {
    case 'dispose':
      cleanup();
      break;
    case 'render':
      renderState(data.state);
      break;
    case 'scrollToLine':
      scrollToLine(data.line);
      break;
    // ... more handlers
  }
}, { signal: getSignal() });

function renderState(state) {
  // Compose rendering from all components
  const fileListHtml = renderFileList({ ... });
  const commentsHtml = renderComments({ ... });
  // ... more

  // Update DOM
  document.getElementById('files-list').innerHTML = fileListHtml;
  // ... more

  // Setup handlers
  setupTreeHandlers(container, handlers, getSignal());
  // ... more
}

function cleanup() {
  setupAbortController(); // Resets abort controller
  stateManager.reset();
}

// Export for template.ts if needed
export const webviewScript = `
  // Bundle all the above
`;
```

### Test Scenarios

- **TS1**: Extension builds without errors
- **TS2**: Webview loads correctly
- **TS3**: All features work as before
- **TS4**: Message handling works
- **TS5**: Cleanup works properly

### Acceptance Criteria

- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] All features work
- [ ] script.ts is minimal/empty
- [ ] main.ts is the orchestrator
- [ ] No console errors

---

## Task 16: Cleanup & Verification

**Time**: 1 hour
**Dependencies**: Task 15

### Objective

Final polish, documentation, and verification.

### Changes

1. **Remove unused imports** from all files
2. **Add JSDoc comments** to all exported functions
3. **Verify no console warnings**
4. **Check bundle size** - should not increase significantly
5. **Add type exports** to index files
6. **Update component index** with all exports
7. **Run full test suite**

### Documentation Checklist

Add JSDoc to:
- [ ] All public component functions
- [ ] StateManager methods
- [ ] Utility functions
- [ ] Type interfaces

### Bundle Verification

```bash
# Check bundle size
npm run compile
ls -la dist/webview.js

# Compare with before (should be < 5% increase)
```

### Final Test Checklist

| Feature | Test |
|---------|------|
| File list (list view) | Files display correctly |
| File list (tree view) | Tree structure works |
| File search | Search filters files |
| File selection | Diff loads |
| Diff view | Chunks render |
| Scope view | Scopes render |
| Markdown preview | Preview renders |
| Comments (sidebar) | CRUD works |
| Comments (inline) | Selection & forms work |
| Comments (preview) | Drag selection works |
| Diff search | Find in diff works |
| Line selection | Single & multi-line |
| Draft persistence | Drafts save/restore |
| Sidebar toggle | Expand/collapse |
| Sidebar resize | Drag resize works |
| AI status | Status displays |
| HN feed | Stories load |
| Content view | Links display |

### Acceptance Criteria

- [ ] No dead code
- [ ] All functions documented
- [ ] Bundle size < 5% increase from original
- [ ] No console warnings
- [ ] All exports properly typed
- [ ] Code passes lint
- [ ] All manual tests pass
- [ ] No memory leaks (DevTools verification)

---

## Final Module Count

After completing all tasks:

```
src/adapters/inbound/ui/webview/
├── state/
│   ├── index.ts
│   ├── StateManager.ts
│   └── types.ts
├── utils/
│   ├── index.ts
│   ├── dom.ts
│   ├── events.ts
│   ├── collections.ts
│   └── scroll.ts
├── components/
│   ├── index.ts
│   ├── sidebar/
│   │   ├── index.ts
│   │   ├── Sidebar.ts
│   │   ├── FileList.ts
│   │   ├── FileSearch.ts
│   │   ├── Comments.ts
│   │   └── AIStatus.ts
│   ├── diff/
│   │   ├── index.ts
│   │   ├── DiffViewer.ts
│   │   ├── DiffHeader.ts
│   │   ├── DiffSearch.ts
│   │   ├── ChunkRenderer.ts
│   │   ├── ScopedDiff.ts
│   │   ├── LineSelection.ts
│   │   └── InlineComments.ts
│   ├── markdown/
│   │   ├── index.ts
│   │   ├── MarkdownPreview.ts
│   │   └── PreviewComments.ts
│   ├── waiting/
│   │   ├── index.ts
│   │   ├── WaitingScreen.ts
│   │   └── HNFeed.ts
│   └── content/
│       ├── index.ts
│       └── ContentView.ts
├── main.ts
├── template.ts
├── html.ts
├── styles.ts
├── webview-entry.ts
└── index.ts
```

**Total**: 31 TypeScript files (compared to 1 monolithic script.ts)
**Average Size**: ~100 lines per component file
**Max Size**: ~400 lines (MarkdownPreview, ChunkRenderer)
