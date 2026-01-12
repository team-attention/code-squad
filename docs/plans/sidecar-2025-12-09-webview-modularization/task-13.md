# Task 13: Extract MarkdownPreview Component

**Component**: MarkdownPreview
**File**: `src/adapters/inbound/ui/webview/components/markdown/MarkdownPreview.ts`
**Source Lines**: 1672-2037 in script.ts
**Complexity**: High
**Dependencies**: `utils/dom.ts` (escapeHtml), syntax highlighting (Shiki), `PreviewComments.ts`

## Objective

Extract markdown preview rendering including markdown-to-HTML conversion, syntax highlighting for code blocks, and diff highlighting in preview mode.

## Current Code Location

```typescript
// script.ts lines 1672-2037
// Markdown: renderMarkdown, renderTable, processInline, highlighting
```

## Functions to Extract

| Function | Description |
|----------|-------------|
| `renderMarkdownPreview()` | Main preview orchestrator |
| `renderMarkdown()` | Convert markdown to HTML |
| `renderFullMarkdownWithHighlights()` | Full file with diff highlights |
| `renderTable()` | Render markdown table |
| `processInline()` | Process inline formatting |
| `renderCodeBlock()` | Render fenced code block |
| `renderTaskList()` | Render task list items |
| `highlightCodeAsync()` | Async code highlighting |

## Implementation

### 1. Create MarkdownPreview.ts

```typescript
// components/markdown/MarkdownPreview.ts

import { escapeHtml } from '../../utils/dom';
import { setupPreviewCommentHandlers, renderPreviewCommentBox } from './PreviewComments';

export interface MarkdownPreviewOptions {
  comments: PreviewComment[];
  additions: Set<number>;
  deletions: Set<number>;
  highlighter: any;
}

/**
 * Render markdown preview view
 * @param content - Markdown content
 * @param filePath - File path for language detection
 * @param options - Rendering options
 * @returns Promise resolving to HTML string
 */
export async function renderMarkdownPreview(
  content: string,
  filePath: string,
  options: MarkdownPreviewOptions
): Promise<string> {
  // Extract from script.ts
}

/**
 * Convert markdown to HTML
 * @param markdown - Markdown string
 * @param highlighter - Shiki highlighter (optional)
 * @returns Promise resolving to HTML string
 */
export async function renderMarkdown(
  markdown: string,
  highlighter?: any
): Promise<string> {
  // Extract from script.ts
}

/**
 * Render full markdown with diff highlights
 * @param content - Full file content
 * @param additions - Lines that are additions
 * @param deletions - Lines that are deletions
 * @param comments - Comments for file
 * @param highlighter - Shiki highlighter
 * @returns Promise resolving to HTML string
 */
export async function renderFullMarkdownWithHighlights(
  content: string,
  additions: Set<number>,
  deletions: Set<number>,
  comments: PreviewComment[],
  highlighter: any
): Promise<string> {
  // Extract from script.ts
}

/**
 * Render markdown table
 * @param rows - Table rows (arrays of cells)
 * @param hasHeader - Whether first row is header
 * @returns HTML string for table
 */
export function renderTable(
  rows: string[][],
  hasHeader: boolean
): string {
  // Extract from script.ts
}

/**
 * Process inline markdown formatting
 * @param text - Text to process
 * @returns HTML string with inline formatting
 */
export function processInline(text: string): string {
  // Bold, italic, code, links, strikethrough
  // Extract from script.ts
}

/**
 * Render fenced code block with syntax highlighting
 * @param code - Code content
 * @param language - Code language
 * @param highlighter - Shiki highlighter
 * @returns Promise resolving to HTML string
 */
export async function renderCodeBlock(
  code: string,
  language: string,
  highlighter: any
): Promise<string> {
  // Extract from script.ts
}

/**
 * Render task list items
 * @param items - List items with checkbox status
 * @returns HTML string for task list
 */
export function renderTaskList(
  items: Array<{ checked: boolean; text: string }>
): string {
  // Extract from script.ts
}

/**
 * Parse markdown into blocks
 * @param markdown - Markdown string
 * @returns Array of block objects
 */
export function parseMarkdownBlocks(
  markdown: string
): MarkdownBlock[] {
  // Extract from script.ts
}

/**
 * Render single markdown block
 * @param block - Block to render
 * @param highlighter - Shiki highlighter
 * @returns Promise resolving to HTML string
 */
export async function renderBlock(
  block: MarkdownBlock,
  highlighter: any
): Promise<string> {
  // Dispatch to appropriate renderer
}
```

### 2. Types

```typescript
interface MarkdownBlock {
  type: 'heading' | 'paragraph' | 'code' | 'table' | 'list' | 'blockquote' | 'hr';
  content: string;
  level?: number; // For headings
  language?: string; // For code blocks
  items?: string[]; // For lists
  rows?: string[][]; // For tables
}
```

### 3. Update script.ts

Replace inline markdown rendering with import and call to extracted functions.

## Files to Create/Modify

| File | Action |
|------|--------|
| `components/markdown/MarkdownPreview.ts` | Create |
| `components/markdown/index.ts` | Update |
| `script.ts` | Update |

## Test Scenarios

### TS1: Headers Render
- **Given**: Markdown with # headers
- **When**: Preview renders
- **Then**: Headers display with correct sizes

### TS2: Bold/Italic Render
- **Given**: **bold** and *italic* text
- **When**: Preview renders
- **Then**: Text formatted correctly

### TS3: Links Render
- **Given**: [link](url) in markdown
- **When**: Preview renders
- **Then**: Clickable link displays

### TS4: Code Blocks Render
- **Given**: ```typescript code block
- **When**: Preview renders
- **Then**: Code highlighted with syntax colors

### TS5: Tables Render
- **Given**: Markdown table
- **When**: Preview renders
- **Then**: HTML table displays

### TS6: Task Lists Render
- **Given**: - [x] and - [ ] items
- **When**: Preview renders
- **Then**: Checkboxes display (checked/unchecked)

### TS7: Diff Highlights
- **Given**: Line 10 is addition
- **When**: Preview renders
- **Then**: Line 10 has green background

### TS8: Deletion Strikethrough
- **Given**: Line 15 is deletion
- **When**: Preview renders
- **Then**: Line 15 has strikethrough style

### TS9: Comment Integration
- **Given**: Comment on lines 10-12
- **When**: Preview renders
- **Then**: Comment box appears at correct position

### TS10: Nested Lists
- **Given**: Nested bullet lists
- **When**: Preview renders
- **Then**: Proper indentation displays

### TS11: Blockquotes
- **Given**: > quoted text
- **When**: Preview renders
- **Then**: Blockquote styled correctly

### TS12: Inline Code
- **Given**: \`inline code\`
- **When**: Preview renders
- **Then**: Monospace styled code

## Acceptance Criteria

- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] Headers render correctly (h1-h6)
- [ ] Bold/italic/strikethrough work
- [ ] Links render as clickable
- [ ] Code blocks have syntax highlighting
- [ ] Tables render correctly
- [ ] Task lists with checkboxes
- [ ] Diff highlights (green additions)
- [ ] Deletion strikethrough
- [ ] Comments integrate correctly
- [ ] Nested lists work
- [ ] Blockquotes styled
- [ ] Inline code styled
- [ ] No console errors
- [ ] File size < 400 lines

## Rollback

If issues arise, revert the single commit for this task.
