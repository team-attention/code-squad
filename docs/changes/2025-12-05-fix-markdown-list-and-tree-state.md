# Fix: Markdown numbered list and tree folder state

## Problem

1. **Markdown Preview Numbered List**: Numbered list items separated by blank lines rendered as separate `<ol>` tags, causing all items to display as "1."
2. **Tree Folder State**: Folder collapse state reset when files changed, forcing users to re-collapse folders repeatedly

## Research

### Numbered List Issue
- `renderMarkdown()` in `script.ts` calls `closeAllLists()` on empty lines
- This closes `<ol>` tag, next numbered item opens new `<ol>` starting from 1

### Tree State Issue
- `buildFileTree()` sets `isExpanded: true` for all folders
- `renderFileList()` replaces entire `innerHTML`, losing DOM state
- No mechanism to preserve collapse state across re-renders

## Root Cause

1. **List**: Blank line handling doesn't consider list continuity
2. **Tree**: No persistent storage for folder collapse state

## Solution

### Numbered List
Added lookahead in blank line handling to check if next non-empty line is a root-level list item. If so, only close nested lists while keeping root list open.

```javascript
// Before
if (line.trim() === '') {
  closeAllLists();  // Always closes everything
}

// After
if (line.trim() === '') {
  // Lookahead to check next line
  if (isNextRootListItem && listStack.length > 0) {
    closeListsToLevel(1);  // Keep root list open
  } else {
    closeAllLists();
  }
}
```

### Tree State
Added `collapsedFolders` Set to track collapsed folder paths. Updated `buildFileTree()` to reference this state and `setupTreeHandlers()` to update it on toggle.

```javascript
let collapsedFolders = new Set();

// In buildFileTree
isExpanded: !collapsedFolders.has(currentPath)

// In setupTreeHandlers
if (children.classList.contains('collapsed')) {
  collapsedFolders.add(folderPath);
} else {
  collapsedFolders.delete(folderPath);
}
```

## Files Changed

- `src/adapters/inbound/ui/webview/script.ts`
  - Added `collapsedFolders` state variable
  - Modified blank line handling with lookahead logic
  - Updated `buildFileTree()` to use `collapsedFolders`
  - Updated `setupTreeHandlers()` to persist collapse state

## Validation

- [x] Compile
- [ ] Lint (ESLint config missing - pre-existing issue)
- [ ] Tests (blocked by lint)

## Review

### Self-Evaluation
- [x] Problems solved
- [x] No regression expected
- [x] Architecture compliance (changes only in adapters layer)

### User Feedback
{Pending user verification}

### KB Updates Needed
- [ ] None required - bug fixes only, no new patterns
