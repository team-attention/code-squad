# Task 11: Extract DiffViewer Component

**Component**: DiffViewer
**File**: `src/adapters/inbound/ui/webview/components/diff/DiffViewer.ts`
**Source Lines**: 1560-1670 in script.ts
**Complexity**: High
**Dependencies**: `DiffHeader.ts`, `ChunkRenderer.ts`, `LineSelection.ts`, `InlineComments.ts`, `ScopedDiff.ts`

## Objective

Extract the main diff viewer orchestrator that coordinates header rendering, chunk rendering, and view mode switching (unified diff vs scope view).

## Current Code Location

```typescript
// script.ts lines 1560-1670
// Main diff rendering orchestration
```

## Functions to Extract

| Function | Description |
|----------|-------------|
| `renderDiff()` | Main diff render orchestrator |
| `renderUnifiedDiff()` | Render unified diff view |
| `switchViewMode()` | Switch between diff/scope/preview |
| `ensureDefaultHeaderStructure()` | Restore header after content view |
| `setupDiffViewHandlers()` | Setup all diff view handlers |

## Implementation

### 1. Create DiffViewer.ts

```typescript
// components/diff/DiffViewer.ts

import { renderDiffHeader } from './DiffHeader';
import { renderChunksToHtml, setupChunkToggleHandlers } from './ChunkRenderer';
import { setupLineSelectionHandlers } from './LineSelection';
import { setupInlineCommentHandlers } from './InlineComments';
import { renderScopedDiff } from './ScopedDiff';

export type ViewMode = 'diff' | 'scope' | 'preview';

export interface DiffData {
  filePath: string;
  chunks: DiffChunk[];
  stats: { additions: number; deletions: number };
  scopeTree?: ScopeNode;
  language: string;
}

export interface DiffViewerState {
  viewMode: ViewMode;
  comments: InlineComment[];
  collapsedChunks: Set<number>;
  collapsedScopes: Set<string>;
  highlightMap: Map<number, string>;
}

export interface DiffViewerHandlers {
  onCommentSubmit: (startLine: number, endLine: number, text: string) => void;
  onCommentEdit: (id: string, newText: string) => void;
  onCommentDelete: (id: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onDraftSave: (draft: CommentDraft) => void;
}

/**
 * Render complete diff view (header + content)
 * @param data - Diff data
 * @param state - Current view state
 * @param highlighter - Shiki highlighter
 * @returns Promise resolving to HTML string
 */
export async function renderDiff(
  data: DiffData,
  state: DiffViewerState,
  highlighter: any
): Promise<string> {
  // Extract from script.ts
}

/**
 * Render unified diff view (chunks)
 * @param data - Diff data
 * @param state - View state
 * @param highlighter - Shiki highlighter
 * @returns Promise resolving to HTML string
 */
export async function renderUnifiedDiff(
  data: DiffData,
  state: DiffViewerState,
  highlighter: any
): Promise<string> {
  // Extract from script.ts
}

/**
 * Switch diff view mode
 * @param container - Diff container
 * @param newMode - Target view mode
 * @param data - Diff data
 * @param state - View state
 * @param highlighter - Shiki highlighter
 */
export async function switchViewMode(
  container: HTMLElement,
  newMode: ViewMode,
  data: DiffData,
  state: DiffViewerState,
  highlighter: any
): Promise<void> {
  // Extract from script.ts
}

/**
 * Ensure header has default structure (after content view)
 * @param headerEl - Header element
 */
export function ensureDefaultHeaderStructure(headerEl: HTMLElement): void {
  // Extract from script.ts
}

/**
 * Setup all diff view handlers
 * @param container - Diff container
 * @param handlers - Event handlers
 * @param vscode - VSCode API
 * @param signal - AbortSignal for cleanup
 */
export function setupDiffViewHandlers(
  container: HTMLElement,
  handlers: DiffViewerHandlers,
  vscode: any,
  signal: AbortSignal
): void {
  // Compose handlers from sub-components
  setupChunkToggleHandlers(container, handlers.onChunkToggle, signal);
  setupLineSelectionHandlers(container, handlers.onSelection, signal);
  setupInlineCommentHandlers(container, handlers.onComment, vscode, signal);
}

/**
 * Toggle between Diff and Scope view
 * @param currentMode - Current view mode
 * @param canScope - Whether scope view is available
 * @returns New view mode
 */
export function toggleDiffViewMode(
  currentMode: ViewMode,
  canScope: boolean
): ViewMode {
  // Extract from script.ts
}
```

### 2. Window Functions

```typescript
// Expose on window for onclick in header
window.toggleDiffViewMode = () => { ... };
```

### 3. Update script.ts

Replace inline diff rendering with import and call to extracted functions.

## Files to Create/Modify

| File | Action |
|------|--------|
| `components/diff/DiffViewer.ts` | Create |
| `components/diff/index.ts` | Update |
| `script.ts` | Update |

## Test Scenarios

### TS1: Diff Renders
- **Given**: File selected
- **When**: Diff data available
- **Then**: Header and chunks render

### TS2: Header Shows
- **Given**: Diff rendering
- **When**: Header renders
- **Then**: Shows file path, icon, stats

### TS3: Chunks Render
- **Given**: Diff with 3 chunks
- **When**: Diff renders
- **Then**: All chunks display

### TS4: Toggle to Scope View
- **Given**: TypeScript file in diff view
- **When**: User clicks "Scope" toggle
- **Then**: Switches to scope view

### TS5: Toggle Back to Diff
- **Given**: In scope view
- **When**: User clicks "Diff" toggle
- **Then**: Returns to unified diff view

### TS6: Scope Unavailable
- **Given**: JSON file selected
- **When**: Diff renders
- **Then**: No scope toggle visible

### TS7: Preview Available
- **Given**: Markdown file selected
- **When**: Diff renders
- **Then**: Preview toggle visible

### TS8: Header Restoration
- **Given**: After content view displayed
- **When**: Diff renders again
- **Then**: Header structure restored

### TS9: All Handlers Work
- **Given**: Diff displayed
- **When**: Various interactions
- **Then**: Selection, comments, chunk toggle all work

## Acceptance Criteria

- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] Diff renders with header and chunks
- [ ] View mode toggle works
- [ ] Scope view switches correctly
- [ ] Header restores after content view
- [ ] All sub-component handlers work
- [ ] No console errors
- [ ] File size < 300 lines

## Notes

This is the main orchestrator component that ties together:
- DiffHeader (Task 6)
- ChunkRenderer (Task 9)
- ScopedDiff (Task 10)
- LineSelection (Task 7)
- InlineComments (Task 8)

It should delegate rendering to these components and coordinate their interactions.

## Rollback

If issues arise, revert the single commit for this task.
