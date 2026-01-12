# Task 8: Inline Comment Display

**Phase**: 3 - Inline Comments in Diff Viewer
**Dependencies**: Task 7
**Files**: 2

## Objective

Render comment boxes inline within the diff viewer below their target lines. Include fold toggle button on each comment, and edit/delete for pending comments.

## Files to Modify

### 1. Webview Script - Inline Comment Rendering

Update diff rendering to include comment content in inline rows:

```typescript
function renderInlineComments(lineNum, comments, currentFile) {
  // Filter comments for this line
  const lineComments = comments.filter(c =>
    c.file === currentFile && c.line === lineNum
  );

  if (lineComments.length === 0) return '';

  return lineComments.map(comment => {
    const isPending = !comment.isSubmitted;
    const statusClass = isPending ? 'pending' : 'submitted';

    return `
      <div class="inline-comment-box ${statusClass}" data-comment-id="${comment.id}">
        <div class="inline-comment-header">
          <button class="fold-toggle" onclick="toggleCommentFold('${comment.id}')" title="Fold comment">
            <span class="fold-icon">▼</span>
          </button>
          <span class="comment-author">Comment</span>
          ${isPending ? `
            <div class="inline-comment-actions">
              <button class="btn-icon" onclick="startInlineEdit('${comment.id}')" title="Edit">
                <span class="codicon codicon-edit"></span>
              </button>
              <button class="btn-icon btn-danger" onclick="deleteComment('${comment.id}')" title="Delete">
                <span class="codicon codicon-trash"></span>
              </button>
            </div>
          ` : `
            <span class="submitted-label">submitted</span>
          `}
        </div>
        <div class="inline-comment-body" id="inline-body-${comment.id}">
          ${escapeHtml(comment.text)}
        </div>
        <div class="inline-comment-edit" id="inline-edit-${comment.id}" style="display: none;">
          <textarea class="comment-textarea">${escapeHtml(comment.text)}</textarea>
          <div class="comment-form-actions">
            <button class="btn-secondary" onclick="cancelInlineEdit('${comment.id}')">Cancel</button>
            <button onclick="saveInlineEdit('${comment.id}')">Save</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
```

Update `renderChunksToHtml()` to call this function:

```typescript
// In the inline-comment-row section:
if (hasComments) {
  html += `
    <tr class="inline-comment-row collapsed" data-line="${lineNum}">
      <td colspan="3">
        <div class="inline-comments">
          ${renderInlineComments(lineNum, comments, currentFile)}
        </div>
      </td>
    </tr>
  `;
}
```

### 2. Webview Script - Edit/Fold Handlers

```typescript
// Fold toggle for individual comment
function toggleCommentFold(commentId) {
  const body = document.getElementById(`inline-body-${commentId}`);
  const box = document.querySelector(`.inline-comment-box[data-comment-id="${commentId}"]`);
  const icon = box?.querySelector('.fold-icon');

  if (body && box) {
    const isCollapsed = box.classList.toggle('folded');
    if (icon) {
      icon.textContent = isCollapsed ? '▶' : '▼';
    }
  }
}

// Inline edit functions
function startInlineEdit(commentId) {
  document.getElementById(`inline-body-${commentId}`).style.display = 'none';
  document.getElementById(`inline-edit-${commentId}`).style.display = 'block';
}

function cancelInlineEdit(commentId) {
  document.getElementById(`inline-body-${commentId}`).style.display = 'block';
  document.getElementById(`inline-edit-${commentId}`).style.display = 'none';
}

function saveInlineEdit(commentId) {
  const textarea = document.querySelector(`#inline-edit-${commentId} textarea`);
  const text = textarea.value.trim();
  if (text) {
    vscode.postMessage({ type: 'editComment', id: commentId, text });
  }
  cancelInlineEdit(commentId);
}
```

### 3. Webview Script - Inline Comment Creation

Add ability to create comments from gutter click on empty lines:

```typescript
// Modify gutter click handler
function handleGutterClick(lineNum, hasComments) {
  if (hasComments) {
    toggleInlineComment(lineNum);
  } else {
    showInlineCommentForm(lineNum, lineNum);
  }
}
```

Update gutter onclick:
```html
<td class="diff-gutter ${markerClass}"
    onclick="handleGutterClick(${lineNum}, ${hasComments})">
```

### 4. Webview Styles

```css
/* Inline comment box */
.inline-comment-box {
  background: var(--vscode-editor-inactiveSelectionBackground);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  margin-bottom: 8px;
  overflow: hidden;
}

.inline-comment-box:last-child {
  margin-bottom: 0;
}

.inline-comment-box.pending {
  border-left: 3px solid var(--vscode-textLink-foreground);
}

.inline-comment-box.submitted {
  border-left: 3px solid var(--vscode-descriptionForeground);
  opacity: 0.8;
}

/* Comment header */
.inline-comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: var(--vscode-titleBar-inactiveBackground);
  border-bottom: 1px solid var(--vscode-panel-border);
}

.fold-toggle {
  background: transparent;
  border: none;
  color: var(--vscode-foreground);
  cursor: pointer;
  padding: 2px;
  font-size: 10px;
}

.fold-toggle:hover {
  background: var(--vscode-toolbar-hoverBackground);
  border-radius: 2px;
}

.fold-icon {
  display: inline-block;
  width: 10px;
}

.comment-author {
  flex: 1;
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
}

.inline-comment-actions {
  display: flex;
  gap: 4px;
}

.submitted-label {
  font-size: 10px;
  color: var(--vscode-charts-green);
}

/* Comment body */
.inline-comment-body {
  padding: 8px;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
}

.inline-comment-box.folded .inline-comment-body {
  display: none;
}

/* Edit form */
.inline-comment-edit {
  padding: 8px;
}

.inline-comment-edit textarea {
  width: 100%;
  min-height: 60px;
  margin-bottom: 8px;
  resize: vertical;
}

/* Inline form row (for creating new comment) */
.inline-form-row {
  background: var(--vscode-editor-background);
}

.inline-form-row td {
  padding: 8px;
}
```

## Data Flow

```
Diff renders
    │
    ├── For each line with comments:
    │   ├── Add gutter marker
    │   └── Add inline-comment-row with renderInlineComments()
    │
User interacts
    │
    ├── Click marker (has comments) → toggleInlineComment() → show/hide row
    ├── Click marker (no comments) → showInlineCommentForm() → create form
    ├── Click fold button → toggleCommentFold() → collapse body only
    ├── Click edit → startInlineEdit() → show textarea
    ├── Save edit → saveInlineEdit() → postMessage('editComment')
    └── Click delete → deleteComment() → postMessage('deleteComment')
```

## State Requirements

The webview needs access to comments for the current file. Update render state:

```typescript
// In render message
{
  type: 'render',
  state: {
    // existing...
    diff: {
      // existing diff data...
    },
    commentsForFile: CommentInfo[], // Comments filtered to current file
  }
}
```

## Validation

- [ ] Inline comments render below their target lines
- [ ] Pending comments show edit/delete buttons
- [ ] Submitted comments show "submitted" label, no edit/delete
- [ ] Fold button collapses comment body
- [ ] Edit shows textarea with current text
- [ ] Save edit sends message and updates comment
- [ ] Delete sends message and removes comment
- [ ] Clicking gutter on empty line shows add form
- [ ] Multiple comments on same line all render

## Test Scenarios

1. View file with pending inline comment → shows with edit/delete
2. View file with submitted inline comment → shows without edit/delete
3. Click fold → body collapses, icon changes to ▶
4. Click fold again → body expands, icon changes to ▼
5. Edit inline comment → updates in both diff and sidebar
6. Delete inline comment → removes from both
7. Click gutter on line without comment → shows add form
8. Add comment from gutter → appears inline and in sidebar
