# Tasks 7-16: Remaining Component Extractions

This document provides a summary overview of the remaining tasks. Each task follows the same pattern as Tasks 1-6 but with increasing complexity.

## Task 7: Extract DiffSearch Component

**Time**: 1-2 hours
**Lines**: 136-322 from script.ts
**Files**: `components/diff/DiffSearch.ts`

### Functionality
- Diff search input handling (Cmd/Ctrl+F)
- Search query processing with debouncing
- Match highlighting in diff viewer
- Navigation (prev/next) through matches
- Match counter display

### Key Functions
- `performDiffSearch()` - Search through diff content
- `highlightDiffMatches()` - Add highlight spans to matches
- `navigateDiffSearch()` - Move between matches
- `clearDiffHighlights()` - Remove highlights
- `updateNavButtons()` - Enable/disable navigation
- `closeDiffSearch()` - Reset search state

### Dependencies
- utils/dom.ts (escapeHtml, query selectors)
- utils/events.ts (getSignal for event listeners)
- StateManager (diffSearchMatches, diffSearchCurrentIndex, diffSearchQuery)
- MAX_SEARCH_MATCHES constant

### Test Scenarios
- Press Cmd+F to focus search
- Type query, see matches highlighted
- Navigate with Enter/Shift+Enter
- Press Escape to close search
- Switch files preserves/clears search state

---

## Task 8: Extract Comments Component

**Time**: 1-2 hours
**Lines**: 712-846 from script.ts
**Files**: `components/sidebar/Comments.ts`

### Functionality
- Render comments list in sidebar
- Edit/delete comment handlers
- Navigate to comment in diff
- Toggle submitted history
- Color coding for multi-line comments

### Key Functions
- `renderComments()` - Render comment list HTML
- `startEditComment()`, `cancelEditComment()`, `saveEditComment()` - Edit handlers
- `deleteComment()` - Delete handler
- `toggleSubmittedHistory()` - Collapse/expand submitted section
- `navigateToComment()` - Scroll to comment in diff

### Window Functions
- All edit/delete functions exposed on window for onclick

### Dependencies
- utils/dom.ts (escapeHtml)
- utils/scroll.ts (saveScrollPosition)
- vscode API for postMessage

### Test Scenarios
- Comments render with correct colors
- Edit comment inline
- Delete comment
- Navigate to comment location
- Toggle submitted section

---

## Task 9: Extract FileList Component

**Time**: 2 hours
**Lines**: 454-710 from script.ts
**Files**: `components/sidebar/FileList.ts`

### Functionality
- Render file list (list and tree views)
- File search with content matching
- Tree view folder collapse/expand
- File selection
- Badge display (A/M/D status)

### Key Functions
- `renderFileList()` - Main render function
- `buildFileTree()` - Build tree structure from flat list
- `renderTreeNode()` - Render tree node recursively
- `sortTreeNode()` - Sort folders before files
- `countFiles()` - Count files in folder
- `setupTreeHandlers()` - Tree folder toggle handlers

### Dependencies
- utils/dom.ts (escapeHtml)
- utils/events.ts (getSignal)
- StateManager (collapsedFolders)
- Search debouncing

### Test Scenarios
- Files render in list view
- Files render in tree view
- Search filters files
- Content match highlighting
- Tree folders collapse/expand
- File selection works
- View mode toggle (List/Tree)

---

## Task 10: Extract MarkdownPreview Component

**Time**: 2-3 hours
**Lines**: 1624-2349 from script.ts
**Files**: `components/diff/MarkdownPreview.ts`

### Functionality
- Markdown rendering (headers, lists, tables, code blocks)
- Syntax highlighting for code blocks
- Diff highlighting in preview
- Comment selection in preview
- Preview comment forms
- Inline processing (bold, italic, links)

### Key Functions
- `renderMarkdownPreview()` - Main preview orchestrator
- `renderMarkdown()` - Convert markdown to HTML
- `renderTable()` - Table rendering
- `processInline()` - Bold, italic, links
- `renderFullMarkdownWithHighlights()` - Full file with diff highlights
- `setupPreviewCommentHandlers()` - Drag selection for comments
- `highlightCodeAsync()` - Async code highlighting with Shiki

### Window Functions
- `toggleDiffViewMode()` - Switch between Diff and Preview
- `closePreviewCommentForm()` - Cancel comment
- `submitPreviewComment()` - Add comment
- `startPreviewCommentEdit()`, etc - Comment edit functions

### Dependencies
- utils/dom.ts (escapeHtml)
- utils/events.ts (getSignal)
- utils/scroll.ts (saveScrollPosition)
- window.SidecarHighlighter (Shiki)

### Test Scenarios
- Markdown renders correctly (all features)
- Code blocks highlighted
- Tables render
- Task lists with checkboxes
- Drag to select lines for comment
- Comment forms work
- Switch between Diff and Preview modes

---

## Task 11: Extract ScopedDiff Component

**Time**: 2-3 hours
**Lines**: 1022-1513 from script.ts
**Files**: `components/diff/ScopedDiff.ts`

### Functionality
- Scope-based diff view (classes, methods, functions)
- Scope tree rendering with collapse/expand
- Syntax highlighting per line
- Inline comments in scoped view
- Scope statistics (additions/deletions)
- Fallback for unsupported file types

### Key Functions
- `renderScopedDiff()` - Main scoped diff renderer
- `renderScopeNode()` - Render scope recursively
- `renderScopeDiffLines()` - Render lines within scope
- `collectScopeLines()` - Gather lines for batch highlighting
- `setupScopeHandlers()` - Collapse/expand handlers
- `setupScopeLineHandlers()` - Line selection and comments
- `scrollToLineInScopedDiff()` - Navigate to line

### Constants
- SCOPE_ICONS - Icons for different scope types

### Dependencies
- utils/dom.ts (escapeHtml)
- utils/events.ts (getSignal)
- StateManager (scopedDiffHighlightMap, scopedDiffCurrentFile)
- window.SidecarHighlighter
- MAX_HIGHLIGHT_ENTRIES constant

### Test Scenarios
- Scoped diff renders for supported languages
- Scope tree expand/collapse
- Line selection works
- Comments display correctly
- Toggle between Scope and Diff views
- Fallback message for unsupported files

---

## Task 12: Extract InlineComments Component

**Time**: 2 hours
**Lines**: 848-1003, 2568-2762 from script.ts
**Files**: `components/diff/InlineComments.ts`

### Functionality
- Inline comment forms in diff view
- Line selection (single and multi-line)
- Toggle comment visibility
- Draft comment persistence
- Comment edit/delete inline

### Key Functions
- `toggleInlineComment()` - Show/hide comment row
- `startInlineEdit()`, `cancelInlineEdit()`, `saveInlineEdit()` - Edit handlers
- `scrollToLineInDiff()` - Navigate to comment location
- `showInlineCommentForm()` - Display comment form
- `saveDraftComment()` - Persist draft to extension
- `restoreDraftCommentForm()` - Restore draft on file switch
- `clearLineSelection()` - Clear selected lines
- `updateLineSelection()` - Update multi-line selection

### Window Functions
- `cancelCommentForm()` - Cancel draft
- `submitInlineComment()` - Submit comment

### Dependencies
- utils/dom.ts (escapeHtml)
- utils/events.ts (getSignal)
- utils/scroll.ts (saveScrollPosition)
- StateManager (selection state)

### Test Scenarios
- Click line to add comment
- Multi-line selection
- Comment form displays
- Draft persists on file switch
- Draft restores on return
- Edit inline comment
- Delete inline comment
- Toggle comment visibility

---

## Task 13: Extract DiffViewer Component

**Time**: 2-3 hours
**Lines**: 1515-1622, 2351-2566 from script.ts
**Files**: `components/diff/DiffViewer.ts`

### Functionality
- Unified diff rendering
- Chunk rendering with collapse/expand
- Syntax highlighting
- Line selection
- Comment indicators
- Chunk toggle handlers
- Multi-line comment range indicators

### Key Functions
- `renderDiff()` - Main diff renderer
- `renderChunksToHtml()` - Batch render chunks with highlighting
- `setupLineHoverHandlers()` - Line selection handlers
- `setupChunkToggleHandlers()` - Chunk collapse/expand
- `clearLineSelection()` - Clear selection
- `updateLineSelection()` - Update multi-line selection

### Dependencies
- All previous components (calls them)
- utils/dom.ts
- utils/events.ts
- utils/scroll.ts
- StateManager
- window.SidecarHighlighter

### Test Scenarios
- Diff renders correctly
- Chunks collapse/expand
- Syntax highlighting works
- Line selection works
- Comments display with color indicators
- Multi-line selection
- Chunk scope labels

---

## Task 14: Migrate State Management

**Time**: 2 hours
**Dependencies**: Tasks 4-13

### Objective
Replace all global variables in script.ts with StateManager.

### Changes
1. Remove global variable declarations from script.ts
2. Update all reads to use stateManager getters
3. Update all writes to use stateManager setters
4. Update cleanup() to call stateManager.reset()

### Global Variables to Migrate
```typescript
// Selection state
selectedLineNum -> stateManager.getSelection().selectedLineNum
selectedLineElement -> stateManager.getSelection().selectedLineElement
selectionStartLine -> stateManager.getSelection().selectionStartLine
selectionEndLine -> stateManager.getSelection().selectionEndLine
isSelecting -> stateManager.getSelection().isSelecting

// UI state
isResizing -> stateManager.getUI().isResizing
sidebarWidth -> stateManager.getUI().sidebarWidth
pendingScrollRestore -> stateManager.getUI().pendingScrollRestore
currentFile -> stateManager.getUI().currentFile

// Search state
currentSearchQuery -> stateManager.getSearch().currentSearchQuery
diffSearchQuery -> stateManager.getSearch().diffSearchQuery
diffSearchMatches -> stateManager.getSearch().diffSearchMatches

// View state
collapsedFolders -> stateManager.getView().collapsedFolders
scopedDiffHighlightMap -> stateManager.getView().scopedDiffHighlightMap
```

### Test Scenarios
- All features work with StateManager
- State persists correctly
- Cleanup resets all state
- No memory leaks

---

## Task 15: Integrate Main Entry Point

**Time**: 1-2 hours
**Dependencies**: Task 14

### Objective
Complete the migration by moving all orchestration to main.ts and removing script.ts.

### Changes
1. Move vscode API acquisition to main.ts
2. Move message handler to main.ts
3. Move renderState to main.ts
4. Move cleanup to main.ts
5. Import all components
6. Setup all handlers
7. Delete script.ts

### main.ts Structure
```typescript
import { stateManager } from './state';
import * as components from './components';
import * as utils from './utils';

const vscode = acquireVsCodeApi();

// Setup global handlers
components.setupHNFeedHandlers(vscode);

// Message handler
window.addEventListener('message', (event) => {
  const message = event.data;
  if (message.type === 'dispose') {
    cleanup();
    return;
  }
  if (message.type === 'render' && message.state) {
    renderState(message.state);
  } else if (message.type === 'scrollToLine') {
    // ...
  }
});

function renderState(state) {
  // Orchestrate all component renders
}

function cleanup() {
  utils.abortAllListeners();
  stateManager.reset();
  // Clear DOM
}

// Export for template.ts
export const webviewScript = /* bundle all above */;
```

### Test Scenarios
- Full regression test of all features
- No script.ts references
- Build succeeds
- Bundle size acceptable

---

## Task 16: Cleanup and Optimization

**Time**: 1 hour
**Dependencies**: Task 15

### Objective
Final polish, documentation, and optimization.

### Changes
1. Remove any unused imports
2. Add JSDoc comments to all exported functions
3. Verify no console warnings
4. Check bundle size
5. Add type exports to index files
6. Update component index with all exports

### Documentation
Add JSDoc to:
- All public component functions
- StateManager methods
- Utility functions
- Type interfaces

### Bundle Optimization
- Verify tree shaking works
- Check for duplicate code
- Ensure no circular dependencies

### Test Scenarios
- Final regression test
- Performance benchmarks
- Bundle analysis
- Memory leak check
- Code coverage check

### Acceptance Criteria
-  No dead code
-  All functions documented
-  Bundle size < 5% increase
-  No console warnings
-  All exports properly typed
-  Code passes lint
