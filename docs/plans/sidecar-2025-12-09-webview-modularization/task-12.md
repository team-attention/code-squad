# Task 12: Extract PreviewComments Component

**Component**: PreviewComments
**File**: `src/adapters/inbound/ui/webview/components/markdown/PreviewComments.ts`
**Source Lines**: 2223-2398 in script.ts
**Complexity**: Medium
**Dependencies**: `utils/dom.ts` (escapeHtml), vscode API, preview state

## Objective

Extract markdown preview comment functionality including drag selection, comment forms, and comment display in preview mode.

## Current Code Location

```typescript
// script.ts lines 2223-2398
// Preview comments: selection handlers, form display, comment rendering
```

## Functions to Extract

| Function | Description |
|----------|-------------|
| `setupPreviewCommentHandlers()` | Attach drag selection handlers |
| `handlePreviewMouseDown()` | Start selection |
| `handlePreviewMouseMove()` | Update selection during drag |
| `handlePreviewMouseUp()` | Complete selection |
| `showPreviewCommentForm()` | Show comment form |
| `renderPreviewCommentBox()` | Render comment in preview |
| `getPreviewLineFromElement()` | Get line number from preview element |
| `highlightPreviewSelection()` | Highlight selected lines |
| `clearPreviewSelection()` | Clear selection highlight |

## Implementation

### 1. Create PreviewComments.ts

```typescript
// components/markdown/PreviewComments.ts

import { escapeHtml } from '../../utils/dom';

export interface PreviewComment {
  id: string;
  startLine: number;
  endLine: number;
  text: string;
  colorIndex: number;
}

export interface PreviewSelectionState {
  isSelecting: boolean;
  startLine: number | null;
  endLine: number | null;
  startElement: HTMLElement | null;
}

export interface PreviewCommentHandlers {
  onCommentSubmit: (startLine: number, endLine: number, text: string) => void;
  onCommentEdit: (id: string, newText: string) => void;
  onCommentDelete: (id: string) => void;
}

/**
 * Setup preview comment drag selection handlers
 * @param container - Preview container
 * @param handlers - Event handlers
 * @param vscode - VSCode API
 * @param signal - AbortSignal for cleanup
 */
export function setupPreviewCommentHandlers(
  container: HTMLElement,
  handlers: PreviewCommentHandlers,
  vscode: any,
  signal: AbortSignal
): void {
  // Extract from script.ts
}

/**
 * Handle mousedown to start preview selection
 * @param event - Mouse event
 * @param container - Preview container
 * @returns Updated selection state
 */
export function handlePreviewMouseDown(
  event: MouseEvent,
  container: HTMLElement
): PreviewSelectionState {
  // Extract from script.ts
}

/**
 * Handle mousemove during preview selection
 * @param event - Mouse event
 * @param state - Current selection state
 * @param container - Preview container
 * @returns Updated selection state
 */
export function handlePreviewMouseMove(
  event: MouseEvent,
  state: PreviewSelectionState,
  container: HTMLElement
): PreviewSelectionState {
  // Extract from script.ts
}

/**
 * Handle mouseup to complete preview selection
 * @param event - Mouse event
 * @param state - Current selection state
 * @returns Final selection (startLine, endLine) or null if invalid
 */
export function handlePreviewMouseUp(
  event: MouseEvent,
  state: PreviewSelectionState
): { startLine: number; endLine: number } | null {
  // Extract from script.ts
}

/**
 * Show comment form in preview mode
 * @param container - Preview container
 * @param startLine - Selection start
 * @param endLine - Selection end
 */
export function showPreviewCommentForm(
  container: HTMLElement,
  startLine: number,
  endLine: number
): void {
  // Extract from script.ts
}

/**
 * Render comment box in preview
 * @param comment - Comment to render
 * @param isEditing - Whether in edit mode
 * @returns HTML string for comment box
 */
export function renderPreviewCommentBox(
  comment: PreviewComment,
  isEditing: boolean
): string {
  // Extract from script.ts
}

/**
 * Get line number from preview element
 * @param element - DOM element in preview
 * @returns Line number or null
 */
export function getPreviewLineFromElement(element: HTMLElement): number | null {
  // Extract from script.ts
}

/**
 * Highlight selected lines in preview
 * @param container - Preview container
 * @param startLine - Selection start
 * @param endLine - Selection end
 */
export function highlightPreviewSelection(
  container: HTMLElement,
  startLine: number,
  endLine: number
): void {
  // Extract from script.ts
}

/**
 * Clear preview selection highlight
 * @param container - Preview container
 */
export function clearPreviewSelection(container: HTMLElement): void {
  // Extract from script.ts
}
```

### 2. Create markdown index

Create `components/markdown/index.ts` for markdown component exports.

### 3. Window Functions

```typescript
// Expose on window for onclick
window.closePreviewCommentForm = () => { ... };
window.submitPreviewComment = () => { ... };
window.startPreviewCommentEdit = (id) => { ... };
window.cancelPreviewCommentEdit = () => { ... };
window.savePreviewCommentEdit = (id) => { ... };
window.deletePreviewComment = (id) => { ... };
```

### 4. Update script.ts

Replace inline preview comment code with import and call to extracted functions.

## Files to Create/Modify

| File | Action |
|------|--------|
| `components/markdown/PreviewComments.ts` | Create |
| `components/markdown/index.ts` | Create |
| `script.ts` | Update |

## Test Scenarios

### TS1: Drag Selection
- **Given**: Preview mode displayed
- **When**: User drags from line 10 to line 15
- **Then**: Lines 10-15 highlighted

### TS2: Single Line Selection
- **Given**: Preview mode displayed
- **When**: User clicks single line
- **Then**: Line highlighted, form shows

### TS3: Comment Form Shows
- **Given**: Selection completed
- **When**: Mouseup fires
- **Then**: Comment form appears

### TS4: Submit Preview Comment
- **Given**: Comment form with text
- **When**: User clicks Submit
- **Then**: Comment created, form closes

### TS5: Cancel Preview Form
- **Given**: Comment form open
- **When**: User clicks Cancel
- **Then**: Form closes, selection cleared

### TS6: Comment Display
- **Given**: Comments exist in preview
- **When**: Preview renders
- **Then**: Comments show at correct positions

### TS7: Edit Preview Comment
- **Given**: Comment in preview
- **When**: User clicks edit
- **Then**: Edit form appears

### TS8: Delete Preview Comment
- **Given**: Comment in preview
- **When**: User clicks delete
- **Then**: Comment removed

### TS9: Selection Direction
- **Given**: User drags from line 15 to 10 (reverse)
- **When**: Selection completes
- **Then**: Range normalized (10-15)

### TS10: Color Indicators
- **Given**: Multiple preview comments
- **When**: Comments render
- **Then**: Each has unique color

## Acceptance Criteria

- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] Drag selection works in preview
- [ ] Single line selection works
- [ ] Comment form shows after selection
- [ ] Submit creates comment
- [ ] Cancel closes form
- [ ] Comments display correctly
- [ ] Edit/delete work
- [ ] Color indicators display
- [ ] No console errors
- [ ] File size < 250 lines

## Rollback

If issues arise, revert the single commit for this task.
