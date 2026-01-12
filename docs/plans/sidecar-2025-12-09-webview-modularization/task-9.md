# Task 9: Extract ChunkRenderer Component

**Component**: ChunkRenderer
**File**: `src/adapters/inbound/ui/webview/components/diff/ChunkRenderer.ts`
**Source Lines**: 2399-2567 in script.ts
**Complexity**: High
**Dependencies**: `utils/dom.ts`, syntax highlighting (Shiki), `InlineComments.ts`

## Objective

Extract unified diff chunk rendering including line rendering, syntax highlighting, comment indicators, and chunk collapse/expand functionality.

## Current Code Location

```typescript
// script.ts lines 2399-2567
// Chunk rendering: renderChunksToHtml, line rendering, syntax highlighting
```

## Functions to Extract

| Function | Description |
|----------|-------------|
| `renderChunksToHtml()` | Render all chunks with highlighting |
| `renderChunk()` | Render single chunk |
| `renderChunkHeader()` | Render chunk header with scope label |
| `renderDiffLine()` | Render single diff line |
| `renderLineGutter()` | Render line number gutter |
| `renderCommentIndicator()` | Render comment dot/range indicator |
| `setupChunkToggleHandlers()` | Attach chunk collapse handlers |
| `highlightLinesAsync()` | Batch syntax highlighting |

## Implementation

### 1. Create ChunkRenderer.ts

```typescript
// components/diff/ChunkRenderer.ts

import { escapeHtml } from '../../utils/dom';

export interface DiffChunk {
  header: string;
  oldStart: number;
  newStart: number;
  lines: DiffLine[];
  scopeLabel?: string;
}

export interface DiffLine {
  type: 'add' | 'delete' | 'context';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

export interface ChunkRendererOptions {
  comments: InlineComment[];
  highlighter: any; // Shiki highlighter
  language: string;
  collapsedChunks: Set<number>;
}

/**
 * Render all diff chunks to HTML with syntax highlighting
 * @param chunks - Diff chunks to render
 * @param options - Rendering options
 * @returns Promise resolving to HTML string
 */
export async function renderChunksToHtml(
  chunks: DiffChunk[],
  options: ChunkRendererOptions
): Promise<string> {
  // Extract from script.ts
}

/**
 * Render single chunk HTML
 * @param chunk - Chunk to render
 * @param index - Chunk index
 * @param options - Rendering options
 * @returns HTML string for chunk
 */
export function renderChunk(
  chunk: DiffChunk,
  index: number,
  options: ChunkRendererOptions
): string {
  // Extract from script.ts
}

/**
 * Render chunk header with collapse toggle
 * @param chunk - Chunk data
 * @param index - Chunk index
 * @param isCollapsed - Whether chunk is collapsed
 * @returns HTML string for header
 */
export function renderChunkHeader(
  chunk: DiffChunk,
  index: number,
  isCollapsed: boolean
): string {
  // Extract from script.ts
}

/**
 * Render single diff line
 * @param line - Line data
 * @param highlightedContent - Syntax highlighted content
 * @param comments - Comments affecting this line
 * @returns HTML string for line row
 */
export function renderDiffLine(
  line: DiffLine,
  highlightedContent: string,
  comments: InlineComment[]
): string {
  // Extract from script.ts
}

/**
 * Render line number gutter with comment indicator
 * @param lineNum - Line number
 * @param lineType - Line type (add/delete/context)
 * @param comments - Comments affecting this line
 * @returns HTML string for gutter
 */
export function renderLineGutter(
  lineNum: number | undefined,
  lineType: string,
  comments: InlineComment[]
): string {
  // Extract from script.ts
}

/**
 * Render comment range indicator (colored bar)
 * @param line - Current line number
 * @param comments - All comments for file
 * @returns HTML string for indicator
 */
export function renderCommentIndicator(
  line: number,
  comments: InlineComment[]
): string {
  // Extract from script.ts
}

/**
 * Setup chunk collapse/expand handlers
 * @param container - Diff container
 * @param onToggle - Callback when chunk toggled
 * @param signal - AbortSignal for cleanup
 */
export function setupChunkToggleHandlers(
  container: HTMLElement,
  onToggle: (chunkIndex: number) => void,
  signal: AbortSignal
): void {
  // Extract from script.ts
}

/**
 * Batch highlight lines using Shiki
 * @param lines - Lines to highlight
 * @param language - Language for highlighting
 * @param highlighter - Shiki highlighter instance
 * @returns Promise resolving to highlighted HTML map
 */
export async function highlightLinesAsync(
  lines: string[],
  language: string,
  highlighter: any
): Promise<Map<number, string>> {
  // Extract from script.ts
}
```

### 2. Constants

```typescript
// Comment color palette
export const COMMENT_COLORS = [
  '#4fc3f7', // blue
  '#81c784', // green
  '#ffb74d', // orange
  '#f06292', // pink
  '#ba68c8', // purple
  '#4db6ac', // teal
];
```

### 3. Update script.ts

Replace inline chunk rendering with import and call to extracted functions.

## Files to Create/Modify

| File | Action |
|------|--------|
| `components/diff/ChunkRenderer.ts` | Create |
| `components/diff/index.ts` | Update |
| `script.ts` | Update |

## Test Scenarios

### TS1: Chunks Render
- **Given**: Diff with 3 chunks
- **When**: Diff renders
- **Then**: All 3 chunks display with headers

### TS2: Lines Render
- **Given**: Chunk with add/delete/context lines
- **When**: Chunk renders
- **Then**: Lines show correct colors (+green, -red, context white)

### TS3: Line Numbers
- **Given**: Line with old=10, new=15
- **When**: Line renders
- **Then**: Both line numbers display in gutter

### TS4: Syntax Highlighting
- **Given**: TypeScript file diff
- **When**: Chunk renders
- **Then**: Code has syntax colors

### TS5: Chunk Collapse
- **Given**: Expanded chunk
- **When**: User clicks chunk header
- **Then**: Chunk collapses, only header visible

### TS6: Chunk Expand
- **Given**: Collapsed chunk
- **When**: User clicks chunk header
- **Then**: Chunk expands, lines visible

### TS7: Comment Indicators
- **Given**: Comment on line 10
- **When**: Line 10 renders
- **Then**: Dot indicator shows in gutter

### TS8: Multi-line Comment Range
- **Given**: Comment spanning lines 10-15
- **When**: Lines render
- **Then**: Colored bar shows from line 10 to 15

### TS9: Scope Labels
- **Given**: Chunk in function "handleClick"
- **When**: Chunk header renders
- **Then**: Shows "handleClick" scope label

## Acceptance Criteria

- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] Chunks render with correct headers
- [ ] Lines show correct colors
- [ ] Line numbers display correctly
- [ ] Syntax highlighting works
- [ ] Chunk collapse/expand works
- [ ] Comment indicators display
- [ ] Multi-line ranges show colored bars
- [ ] Scope labels display
- [ ] No console errors
- [ ] File size < 400 lines

## Rollback

If issues arise, revert the single commit for this task.
