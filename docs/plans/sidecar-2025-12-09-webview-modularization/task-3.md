# Task 3: Extract Comments Component

**Component**: Comments
**File**: `src/adapters/inbound/ui/webview/components/sidebar/Comments.ts`
**Source Lines**: 754-940 in script.ts
**Complexity**: Medium
**Dependencies**: `utils/dom.ts` (escapeHtml), vscode API

## Objective

Extract comments list rendering and interaction handlers into a dedicated component.

## Current Code Location

```typescript
// script.ts lines 754-940
// Comments sidebar: render, edit, delete, navigate
```

## Functions to Extract

| Function | Description |
|----------|-------------|
| `renderComments()` | Render comments list HTML |
| `setupCommentHandlers()` | Attach edit/delete/navigate handlers |
| `startEditComment()` | Enter edit mode for comment |
| `cancelEditComment()` | Cancel edit mode |
| `saveEditComment()` | Save edited comment |
| `deleteComment()` | Delete a comment |
| `navigateToComment()` | Scroll to comment in diff |
| `toggleSubmittedHistory()` | Toggle submitted section |

## Implementation

### 1. Create Comments.ts

```typescript
// components/sidebar/Comments.ts

import { escapeHtml } from '../../utils/dom';

export interface Comment {
  id: string;
  file: string;
  startLine: number;
  endLine: number;
  text: string;
  colorIndex?: number;
}

export interface CommentHandlers {
  onEdit: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (file: string, startLine: number, endLine: number) => void;
  onSubmit: () => void;
}

/**
 * Render comments list HTML
 * @param comments - Pending comments
 * @param submittedComments - Submitted comments history
 * @param showSubmitted - Whether submitted section is expanded
 * @returns HTML string for comments panel
 */
export function renderComments(
  comments: Comment[],
  submittedComments: Comment[],
  showSubmitted: boolean
): string {
  // Extract from script.ts
}

/**
 * Setup comment interaction handlers
 * @param container - Comments container element
 * @param handlers - Event handlers
 * @param vscode - VSCode API
 * @param signal - AbortSignal for cleanup
 */
export function setupCommentHandlers(
  container: HTMLElement,
  handlers: CommentHandlers,
  vscode: any,
  signal: AbortSignal
): void {
  // Extract from script.ts
}
```

### 2. Window Functions

Some functions need to be exposed on window for onclick handlers:
- `window.startEditComment`
- `window.cancelEditComment`
- `window.saveEditComment`
- `window.deleteComment`
- `window.navigateToComment`
- `window.toggleSubmittedHistory`

### 3. Update script.ts

Replace inline code with import and call to extracted functions.

## Files to Create/Modify

| File | Action |
|------|--------|
| `components/sidebar/Comments.ts` | Create |
| `components/sidebar/index.ts` | Update |
| `script.ts` | Update |

## Test Scenarios

### TS1: Comments Render
- **Given**: File has 3 pending comments
- **When**: Sidebar comments section renders
- **Then**: All 3 comments display with correct colors

### TS2: Edit Comment
- **Given**: Comment exists in list
- **When**: User clicks edit button
- **Then**: Edit form appears with current text

### TS3: Save Edit
- **Given**: Edit form is open with new text
- **When**: User clicks save
- **Then**: Comment updates, edit form closes

### TS4: Cancel Edit
- **Given**: Edit form is open
- **When**: User clicks cancel
- **Then**: Edit form closes, original text preserved

### TS5: Delete Comment
- **Given**: Comment exists
- **When**: User clicks delete
- **Then**: Comment removed from list

### TS6: Navigate to Comment
- **Given**: Comment on line 50 exists
- **When**: User clicks comment in sidebar
- **Then**: Diff scrolls to line 50, comment highlighted

### TS7: Toggle Submitted History
- **Given**: Submitted comments exist
- **When**: User clicks toggle
- **Then**: Submitted section expands/collapses

## Acceptance Criteria

- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] Comments render with correct colors
- [ ] Edit/save/cancel flow works
- [ ] Delete removes comment
- [ ] Navigation scrolls to correct line
- [ ] Submitted history toggles
- [ ] No console errors
- [ ] File size < 250 lines

## Rollback

If issues arise, revert the single commit for this task.
