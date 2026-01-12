# Task 4: Extract FileList Component

**Component**: FileList
**File**: `src/adapters/inbound/ui/webview/components/sidebar/FileList.ts`
**Source Lines**: 496-752 in script.ts
**Complexity**: Medium
**Dependencies**: `utils/dom.ts` (escapeHtml), `utils/collections.ts` (collapsedFolders state)

## Objective

Extract file list rendering (both list and tree views), file selection, and tree folder handling into a dedicated component.

## Current Code Location

```typescript
// script.ts lines 496-752
// File list: list view, tree view, search filtering, selection
```

## Functions to Extract

| Function | Description |
|----------|-------------|
| `renderFileList()` | Main file list render (dispatches to list or tree) |
| `renderListView()` | Flat list view rendering |
| `buildFileTree()` | Build tree structure from flat file list |
| `renderTreeNode()` | Recursively render tree node |
| `sortTreeNode()` | Sort tree (folders first, then files) |
| `countFiles()` | Count files in folder |
| `setupTreeHandlers()` | Attach folder toggle handlers |
| `filterFiles()` | Filter files by search query |

## Implementation

### 1. Create FileList.ts

```typescript
// components/sidebar/FileList.ts

import { escapeHtml } from '../../utils/dom';

export interface FileItem {
  path: string;
  relativePath: string;
  status: 'A' | 'M' | 'D';
  matchedContent?: string[];
}

export interface FileListProps {
  sessionFiles: FileItem[];
  uncommittedFiles: FileItem[];
  selectedFile: string | null;
  isTreeView: boolean;
  searchQuery: string;
  showUncommitted: boolean;
  collapsedFolders: Set<string>;
}

export interface FileListHandlers {
  onFileSelect: (filePath: string) => void;
  onFolderToggle: (folderPath: string) => void;
}

/**
 * Render file list HTML (list or tree view)
 * @param props - File list properties
 * @returns HTML string for file list
 */
export function renderFileList(props: FileListProps): string {
  // Extract from script.ts
}

/**
 * Build tree structure from flat file list
 * @param files - Flat file list
 * @returns Tree structure
 */
export function buildFileTree(files: FileItem[]): TreeNode {
  // Extract from script.ts
}

/**
 * Setup tree folder toggle handlers
 * @param container - File list container
 * @param handlers - Event handlers
 * @param signal - AbortSignal for cleanup
 */
export function setupTreeHandlers(
  container: HTMLElement,
  handlers: FileListHandlers,
  signal: AbortSignal
): void {
  // Extract from script.ts
}
```

### 2. Types

```typescript
interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: Map<string, TreeNode>;
  file?: FileItem;
}
```

### 3. Update script.ts

Replace inline code with import and call to extracted functions.

## Files to Create/Modify

| File | Action |
|------|--------|
| `components/sidebar/FileList.ts` | Create |
| `components/sidebar/index.ts` | Update |
| `script.ts` | Update |

## Test Scenarios

### TS1: List View Renders
- **Given**: 5 files in session
- **When**: List view mode active
- **Then**: All 5 files display as flat list

### TS2: Tree View Renders
- **Given**: Files in nested folders
- **When**: Tree view mode active
- **Then**: Files display in folder hierarchy

### TS3: File Selection
- **Given**: File list displayed
- **When**: User clicks a file
- **Then**: File is selected, diff renders

### TS4: Folder Toggle
- **Given**: Tree view with expanded folder
- **When**: User clicks folder
- **Then**: Folder collapses, children hidden

### TS5: Search Filters
- **Given**: 10 files, search query "test"
- **When**: Search applied
- **Then**: Only files matching "test" display

### TS6: Content Match Display
- **Given**: Search with content matching
- **When**: File has content match
- **Then**: Matched line preview shown under filename

### TS7: Status Badges
- **Given**: File with status 'A' (added)
- **When**: File list renders
- **Then**: Green 'A' badge displays

### TS8: View Mode Toggle
- **Given**: Currently in list view
- **When**: User toggles to tree view
- **Then**: Display switches to tree structure

## Acceptance Criteria

- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] List view renders correctly
- [ ] Tree view renders correctly
- [ ] File selection works
- [ ] Folder toggle works
- [ ] Search filtering works
- [ ] Content matches display
- [ ] Status badges display
- [ ] No console errors
- [ ] File size < 350 lines

## Rollback

If issues arise, revert the single commit for this task.
