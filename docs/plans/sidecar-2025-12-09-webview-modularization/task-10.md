# Task 10: Extract ScopedDiff Component

**Component**: ScopedDiff
**File**: `src/adapters/inbound/ui/webview/components/diff/ScopedDiff.ts`
**Source Lines**: 1064-1558 in script.ts
**Complexity**: High
**Dependencies**: `utils/dom.ts`, syntax highlighting (Shiki), `LineSelection.ts`, `InlineComments.ts`

## Objective

Extract scope-based diff view rendering including scope tree, line rendering within scopes, collapse/expand, and inline comments.

## Current Code Location

```typescript
// script.ts lines 1064-1558
// Scoped diff: renderScopedDiff, scope tree, handlers
```

## Functions to Extract

| Function | Description |
|----------|-------------|
| `renderScopedDiff()` | Main scoped diff renderer |
| `renderScopeNode()` | Render scope node recursively |
| `renderScopeDiffLines()` | Render lines within scope |
| `renderScopeHeader()` | Render scope header with icon |
| `renderScopeStats()` | Render +/- stats for scope |
| `collectScopeLines()` | Gather lines for batch highlighting |
| `setupScopeHandlers()` | Attach collapse/expand handlers |
| `setupScopeLineHandlers()` | Attach line selection handlers |
| `scrollToLineInScopedDiff()` | Navigate to specific line |

## Implementation

### 1. Create ScopedDiff.ts

```typescript
// components/diff/ScopedDiff.ts

import { escapeHtml } from '../../utils/dom';

export interface ScopeNode {
  name: string;
  type: 'class' | 'method' | 'function' | 'interface' | 'property' | 'file';
  startLine: number;
  endLine: number;
  children: ScopeNode[];
  lines: ScopeDiffLine[];
}

export interface ScopeDiffLine {
  type: 'add' | 'delete' | 'context';
  content: string;
  lineNumber: number;
}

export interface ScopedDiffOptions {
  comments: InlineComment[];
  highlighter: any;
  language: string;
  collapsedScopes: Set<string>;
  highlightMap: Map<number, string>;
}

// Icons for scope types
export const SCOPE_ICONS: Record<string, string> = {
  class: 'C',
  method: 'm',
  function: 'f',
  interface: 'I',
  property: 'p',
  file: '📄',
};

/**
 * Render complete scoped diff view
 * @param scopeTree - Root scope node
 * @param options - Rendering options
 * @returns Promise resolving to HTML string
 */
export async function renderScopedDiff(
  scopeTree: ScopeNode,
  options: ScopedDiffOptions
): Promise<string> {
  // Extract from script.ts
}

/**
 * Render scope node recursively
 * @param node - Scope node
 * @param depth - Nesting depth
 * @param options - Rendering options
 * @returns HTML string for scope
 */
export function renderScopeNode(
  node: ScopeNode,
  depth: number,
  options: ScopedDiffOptions
): string {
  // Extract from script.ts
}

/**
 * Render scope header with toggle
 * @param node - Scope node
 * @param isCollapsed - Whether scope is collapsed
 * @returns HTML string for header
 */
export function renderScopeHeader(
  node: ScopeNode,
  isCollapsed: boolean
): string {
  // Extract from script.ts
}

/**
 * Render diff lines within a scope
 * @param lines - Lines in scope
 * @param highlightMap - Pre-computed highlights
 * @param comments - Comments for these lines
 * @returns HTML string for lines
 */
export function renderScopeDiffLines(
  lines: ScopeDiffLine[],
  highlightMap: Map<number, string>,
  comments: InlineComment[]
): string {
  // Extract from script.ts
}

/**
 * Collect all lines for batch highlighting
 * @param scopeTree - Root scope node
 * @returns Array of {lineNumber, content} for highlighting
 */
export function collectScopeLines(
  scopeTree: ScopeNode
): Array<{ lineNumber: number; content: string }> {
  // Extract from script.ts
}

/**
 * Setup scope collapse/expand handlers
 * @param container - Scoped diff container
 * @param onToggle - Callback when scope toggled
 * @param signal - AbortSignal for cleanup
 */
export function setupScopeHandlers(
  container: HTMLElement,
  onToggle: (scopePath: string) => void,
  signal: AbortSignal
): void {
  // Extract from script.ts
}

/**
 * Setup line selection handlers for scoped diff
 * @param container - Scoped diff container
 * @param handlers - Selection handlers
 * @param signal - AbortSignal for cleanup
 */
export function setupScopeLineHandlers(
  container: HTMLElement,
  handlers: LineSelectionHandlers,
  signal: AbortSignal
): void {
  // Extract from script.ts
}

/**
 * Scroll to specific line in scoped diff
 * @param container - Scoped diff container
 * @param lineNumber - Target line number
 */
export function scrollToLineInScopedDiff(
  container: HTMLElement,
  lineNumber: number
): void {
  // Extract from script.ts
}

/**
 * Render fallback for unsupported file types
 * @param filePath - File path
 * @returns HTML string for fallback message
 */
export function renderScopedDiffFallback(filePath: string): string {
  // Extract from script.ts
}
```

### 2. Update script.ts

Replace inline scoped diff code with import and call to extracted functions.

## Files to Create/Modify

| File | Action |
|------|--------|
| `components/diff/ScopedDiff.ts` | Create |
| `components/diff/index.ts` | Update |
| `script.ts` | Update |

## Test Scenarios

### TS1: Scope Tree Renders
- **Given**: TypeScript file with class and methods
- **When**: Scope view renders
- **Then**: Tree shows class > methods hierarchy

### TS2: Scope Icons
- **Given**: Class "MyClass"
- **When**: Scope header renders
- **Then**: Shows "C" icon for class

### TS3: Scope Stats
- **Given**: Method with +5 -2 changes
- **When**: Scope header renders
- **Then**: Shows "+5 -2" stats

### TS4: Scope Collapse
- **Given**: Expanded scope
- **When**: User clicks scope header
- **Then**: Scope collapses, children hidden

### TS5: Scope Expand
- **Given**: Collapsed scope
- **When**: User clicks scope header
- **Then**: Scope expands, children visible

### TS6: Lines Within Scope
- **Given**: Scope with diff lines
- **When**: Scope renders
- **Then**: Lines show with correct colors

### TS7: Syntax Highlighting
- **Given**: TypeScript code in scope
- **When**: Lines render
- **Then**: Code has syntax colors

### TS8: Line Selection in Scope
- **Given**: Scoped diff displayed
- **When**: User clicks line
- **Then**: Line highlighted, comment form available

### TS9: Inline Comments in Scope
- **Given**: Comment on line in scope
- **When**: Scope renders
- **Then**: Comment indicator shows

### TS10: Navigate to Line
- **Given**: Comment navigation triggered
- **When**: Line is in collapsed scope
- **Then**: Scope expands, scrolls to line

### TS11: Unsupported File Fallback
- **Given**: JSON file selected
- **When**: Scope view requested
- **Then**: Shows fallback message

## Acceptance Criteria

- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] Scope tree renders correctly
- [ ] Scope icons display
- [ ] Scope stats show correct values
- [ ] Collapse/expand works
- [ ] Lines render with correct colors
- [ ] Syntax highlighting works
- [ ] Line selection works
- [ ] Inline comments work
- [ ] Navigation to line works
- [ ] Fallback for unsupported files
- [ ] No console errors
- [ ] File size < 500 lines

## Rollback

If issues arise, revert the single commit for this task.
