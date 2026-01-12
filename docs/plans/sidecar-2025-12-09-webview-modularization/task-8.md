# Task 8: Extract InlineComments Component

**Component**: InlineComments
**File**: `src/adapters/inbound/ui/webview/components/diff/InlineComments.ts`
**Source Lines**: 890-940, 2678-2810 in script.ts
**Complexity**: Medium
**Dependencies**: `utils/dom.ts` (escapeHtml), `LineSelection.ts`, vscode API

## Objective

Extract inline comment functionality including comment forms, draft persistence, toggle visibility, and edit/delete handlers.

## Current Code Location

```typescript
// script.ts lines 890-940 (toggle/edit handlers)
// script.ts lines 2678-2810 (form rendering, draft management)
```

## Functions to Extract

| Function | Description |
|----------|-------------|
| `showInlineCommentForm()` | Display comment form for selection |
| `renderInlineCommentBox()` | Render comment display box |
| `toggleInlineComment()` | Toggle comment visibility in gutter |
| `saveDraftComment()` | Save draft to extension |
| `restoreDraftCommentForm()` | Restore draft on file switch |
| `startInlineEdit()` | Enter edit mode |
| `cancelInlineEdit()` | Cancel edit |
| `saveInlineEdit()` | Save edited comment |
| `submitInlineComment()` | Submit new comment |
| `cancelCommentForm()` | Cancel comment form |

## Implementation

### 1. Create InlineComments.ts

```typescript
// components/diff/InlineComments.ts

import { escapeHtml } from '../../utils/dom';

export interface InlineComment {
  id: string;
  startLine: number;
  endLine: number;
  text: string;
  colorIndex: number;
}

export interface CommentDraft {
  file: string;
  startLine: number;
  endLine: number;
  text: string;
}

export interface InlineCommentHandlers {
  onSubmit: (startLine: number, endLine: number, text: string) => void;
  onEdit: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  onDraftSave: (draft: CommentDraft) => void;
  onDraftClear: (file: string) => void;
}

/**
 * Show inline comment form after line selection
 * @param container - Row container to append form after
 * @param startLine - Selection start line
 * @param endLine - Selection end line
 * @param draftText - Optional draft text to restore
 */
export function showInlineCommentForm(
  container: HTMLElement,
  startLine: number,
  endLine: number,
  draftText?: string
): void {
  // Extract from script.ts
}

/**
 * Render inline comment box HTML
 * @param comment - Comment to render
 * @param isEditing - Whether in edit mode
 * @returns HTML string for comment box
 */
export function renderInlineCommentBox(
  comment: InlineComment,
  isEditing: boolean
): string {
  // Extract from script.ts
}

/**
 * Toggle comment visibility by clicking gutter
 * @param lineNumber - Line number clicked
 * @param comments - All comments for file
 */
export function toggleInlineComment(
  lineNumber: number,
  comments: InlineComment[]
): void {
  // Extract from script.ts
}

/**
 * Setup inline comment handlers
 * @param container - Diff container
 * @param handlers - Event handlers
 * @param vscode - VSCode API
 * @param signal - AbortSignal for cleanup
 */
export function setupInlineCommentHandlers(
  container: HTMLElement,
  handlers: InlineCommentHandlers,
  vscode: any,
  signal: AbortSignal
): void {
  // Extract from script.ts
}

/**
 * Save draft comment to extension
 * @param draft - Draft to save
 * @param vscode - VSCode API
 */
export function saveDraftComment(
  draft: CommentDraft,
  vscode: any
): void {
  // Extract from script.ts
}

/**
 * Restore draft comment form if exists
 * @param container - Diff container
 * @param draft - Draft to restore
 */
export function restoreDraftCommentForm(
  container: HTMLElement,
  draft: CommentDraft | null
): void {
  // Extract from script.ts
}
```

### 2. Window Functions

Expose functions on window for onclick handlers:
- `window.submitInlineComment`
- `window.cancelCommentForm`
- `window.startInlineEdit`
- `window.cancelInlineEdit`
- `window.saveInlineEdit`
- `window.deleteInlineComment`
- `window.toggleInlineComment`

### 3. Update script.ts

Replace inline code with import and call to extracted functions.

## Files to Create/Modify

| File | Action |
|------|--------|
| `components/diff/InlineComments.ts` | Create |
| `components/diff/index.ts` | Update |
| `script.ts` | Update |

## Test Scenarios

### TS1: Show Comment Form
- **Given**: Line 10 selected
- **When**: Selection completes (mouseup)
- **Then**: Comment form appears below line 10

### TS2: Multi-line Form
- **Given**: Lines 10-15 selected
- **When**: Selection completes
- **Then**: Form shows "Lines 10-15" indicator

### TS3: Submit Comment
- **Given**: Comment form with text
- **When**: User clicks Submit
- **Then**: Comment created, form closes

### TS4: Cancel Form
- **Given**: Comment form open
- **When**: User clicks Cancel
- **Then**: Form closes, selection cleared

### TS5: Draft Persistence
- **Given**: Comment form with text "WIP"
- **When**: User switches files
- **Then**: Draft saved to extension

### TS6: Draft Restore
- **Given**: Draft exists for file
- **When**: User returns to file
- **Then**: Comment form restored with draft text

### TS7: Toggle Comment
- **Given**: Comment on line 10
- **When**: User clicks gutter dot
- **Then**: Comment box expands/collapses

### TS8: Edit Comment
- **Given**: Existing comment
- **When**: User clicks edit
- **Then**: Edit form appears with current text

### TS9: Delete Comment
- **Given**: Existing comment
- **When**: User clicks delete
- **Then**: Comment removed

### TS10: Color Indicators
- **Given**: Multiple multi-line comments
- **When**: Comments render
- **Then**: Each has unique color from palette

## Acceptance Criteria

- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] Comment form shows after selection
- [ ] Submit creates comment
- [ ] Cancel closes form
- [ ] Draft saves on file switch
- [ ] Draft restores on return
- [ ] Toggle expands/collapses comment
- [ ] Edit/delete work correctly
- [ ] Color indicators display
- [ ] No console errors
- [ ] File size < 300 lines

## Rollback

If issues arise, revert the single commit for this task.
