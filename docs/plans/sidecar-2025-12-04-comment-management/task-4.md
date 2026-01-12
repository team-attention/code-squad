# Task 4: Sidebar UI Changes

**Phase**: 1 - Comment Lifecycle
**Dependencies**: Task 3
**Files**: 2 (webview HTML/JS in SidecarPanelAdapter)

## Objective

Update sidebar comment rendering with:
1. Edit/delete buttons on pending comments
2. Inline text editing for comments
3. Collapsed "Submitted (N)" history section

## Files to Modify

### 1. Webview Script (in `SidecarPanelAdapter.getHtmlForWebview()`)

#### Update `renderComments()` function

```typescript
function renderComments(comments, submittedHistory = []) {
  const container = document.getElementById('comments-container');
  if (!container) return;

  // Separate pending and submitted
  const pending = comments.filter(c => !c.isSubmitted);
  const submitted = submittedHistory || [];

  let html = '';

  // Pending comments with edit/delete
  pending.forEach(comment => {
    const lineDisplay = comment.endLine
      ? `${comment.line}-${comment.endLine}`
      : comment.line;

    html += `
      <div class="comment-item" data-id="${comment.id}">
        <div class="comment-header">
          <span class="comment-location" onclick="navigateToComment('${comment.id}')">
            ${comment.file}:${lineDisplay}
          </span>
          <div class="comment-actions">
            <button class="btn-icon" onclick="startEditComment('${comment.id}')" title="Edit">
              <span class="codicon codicon-edit"></span>
            </button>
            <button class="btn-icon btn-danger" onclick="deleteComment('${comment.id}')" title="Delete">
              <span class="codicon codicon-trash"></span>
            </button>
          </div>
        </div>
        <div class="comment-text" id="comment-text-${comment.id}">${escapeHtml(comment.text)}</div>
        <div class="comment-edit-form" id="comment-edit-${comment.id}" style="display: none;">
          <textarea class="comment-textarea">${escapeHtml(comment.text)}</textarea>
          <div class="comment-form-actions">
            <button class="btn-secondary" onclick="cancelEditComment('${comment.id}')">Cancel</button>
            <button onclick="saveEditComment('${comment.id}')">Save</button>
          </div>
        </div>
      </div>
    `;
  });

  // Submitted history section
  if (submitted.length > 0) {
    html += `
      <div class="submitted-section">
        <div class="submitted-header" onclick="toggleSubmittedHistory()">
          <span class="submitted-toggle" id="submitted-toggle">▶</span>
          <span>Submitted (${submitted.length})</span>
        </div>
        <div class="submitted-list" id="submitted-list" style="display: none;">
          ${submitted.map(comment => {
            const lineDisplay = comment.endLine
              ? `${comment.line}-${comment.endLine}`
              : comment.line;
            return `
              <div class="comment-item submitted" data-id="${comment.id}">
                <div class="comment-header">
                  <span class="comment-location">${comment.file}:${lineDisplay}</span>
                  <span class="submitted-badge">submitted</span>
                </div>
                <div class="comment-text">${escapeHtml(comment.text)}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}
```

#### Add JavaScript handlers

```typescript
// Edit comment functions
function startEditComment(id) {
  document.getElementById(`comment-text-${id}`).style.display = 'none';
  document.getElementById(`comment-edit-${id}`).style.display = 'block';
}

function cancelEditComment(id) {
  document.getElementById(`comment-text-${id}`).style.display = 'block';
  document.getElementById(`comment-edit-${id}`).style.display = 'none';
}

function saveEditComment(id) {
  const textarea = document.querySelector(`#comment-edit-${id} textarea`);
  const text = textarea.value.trim();
  if (text) {
    vscode.postMessage({ type: 'editComment', id, text });
  }
  cancelEditComment(id);
}

// Delete comment
function deleteComment(id) {
  vscode.postMessage({ type: 'deleteComment', id });
}

// Toggle submitted history
function toggleSubmittedHistory() {
  const list = document.getElementById('submitted-list');
  const toggle = document.getElementById('submitted-toggle');
  if (list.style.display === 'none') {
    list.style.display = 'block';
    toggle.textContent = '▼';
  } else {
    list.style.display = 'none';
    toggle.textContent = '▶';
  }
}

// Navigate to comment
function navigateToComment(id) {
  vscode.postMessage({ type: 'navigateToComment', id });
}
```

### 2. Webview Styles

```css
/* Comment actions */
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.comment-location {
  cursor: pointer;
  color: var(--vscode-textLink-foreground);
}

.comment-location:hover {
  text-decoration: underline;
}

.comment-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--vscode-foreground);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
}

.btn-icon:hover {
  background: var(--vscode-toolbar-hoverBackground);
}

.btn-icon.btn-danger:hover {
  color: var(--vscode-errorForeground);
}

/* Edit form */
.comment-edit-form {
  margin-top: 8px;
}

.comment-edit-form textarea {
  width: 100%;
  min-height: 60px;
  margin-bottom: 8px;
}

/* Submitted section */
.submitted-section {
  margin-top: 16px;
  border-top: 1px solid var(--vscode-panel-border);
  padding-top: 8px;
}

.submitted-header {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
}

.submitted-header:hover {
  color: var(--vscode-foreground);
}

.submitted-toggle {
  font-size: 10px;
}

.submitted-list {
  margin-top: 8px;
}

.comment-item.submitted {
  opacity: 0.7;
  border-left-color: var(--vscode-descriptionForeground);
}

.submitted-badge {
  font-size: 10px;
  color: var(--vscode-charts-green);
}
```

### 3. PanelState & StateManager Updates

Add `submittedHistory` to state:

```typescript
// In PanelState interface
interface PanelState {
  // existing...
  submittedHistory: CommentInfo[];
}

// In PanelStateManager
private state: PanelState = {
  // existing...
  submittedHistory: [],
};

// Modify submit flow to move comments to history
moveToSubmittedHistory(ids: string[]): void {
  const toMove = this.state.comments.filter(c => ids.includes(c.id));
  this.state.submittedHistory = [...this.state.submittedHistory, ...toMove.map(c => ({ ...c, isSubmitted: true }))];
  this.state.comments = this.state.comments.filter(c => !ids.includes(c.id));
  this.render();
}

clearSubmittedHistory(): void {
  this.state.submittedHistory = [];
  this.render();
}
```

## Architecture Compliance

- [ ] All UI logic in webview script (browser environment)
- [ ] State changes go through message passing
- [ ] Panel state manager owns state
- [ ] Codicon icons used for buttons

## Validation

- [ ] Edit button shows on pending comments
- [ ] Delete button shows on pending comments
- [ ] Clicking edit shows textarea with current text
- [ ] Saving edit updates comment
- [ ] Canceling edit hides form
- [ ] Deleting comment removes it
- [ ] Submitted history section appears after submit
- [ ] History collapses/expands on click
- [ ] Submitted comments are read-only (no edit/delete)

## Test Scenarios

1. Edit comment text → saves and re-renders
2. Delete comment → removes from list
3. Submit comments → moves to collapsed history
4. Expand/collapse history section
5. Extension restart → history cleared (session-scoped)
