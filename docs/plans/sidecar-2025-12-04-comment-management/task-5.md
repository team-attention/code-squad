# Task 5: Click-to-Navigate

**Phase**: 2 - Sidebar → Diff Navigation
**Dependencies**: Task 4
**Files**: 2

## Objective

Clicking a comment in the sidebar opens the file's diff viewer and scrolls to the commented line. Also auto-expand sidebar if collapsed.

## Files to Modify

### 1. `src/adapters/inbound/ui/SidecarPanelAdapter.ts`

#### Add `navigateToComment` message handler

```typescript
case 'navigateToComment': {
  const { id } = message;

  // Find comment in state
  const comment = this.panelStateManager.getState().comments.find(c => c.id === id)
    || this.panelStateManager.getState().submittedHistory.find(c => c.id === id);

  if (!comment) {
    return;
  }

  // Select the file to show its diff
  await this.handleSelectFile(comment.file);

  // Send scroll command to webview
  this.panel?.webview.postMessage({
    type: 'scrollToLine',
    line: comment.line,
    commentId: id,
  });

  break;
}
```

#### Update render message to include navigation target

When sending render state, include a `scrollTarget` if navigating:

```typescript
// Add to PanelState or use separate message
interface ScrollTarget {
  line: number;
  commentId: string;
}
```

### 2. Webview Script Updates

#### Add scroll handler

```typescript
// Handle scroll message from extension
window.addEventListener('message', event => {
  const message = event.data;
  switch (message.type) {
    case 'scrollToLine':
      scrollToLineInDiff(message.line, message.commentId);
      break;
    // existing handlers...
  }
});

function scrollToLineInDiff(lineNumber, commentId) {
  // Expand sidebar if collapsed
  const sidebar = document.querySelector('.sidebar');
  if (sidebar?.classList.contains('collapsed')) {
    toggleSidebar(); // Use existing toggle function
  }

  // Find the line in diff viewer
  const diffContainer = document.getElementById('diff-container');
  if (!diffContainer) return;

  // Look for the line row
  const lineRow = diffContainer.querySelector(`tr[data-line="${lineNumber}"]`);
  if (lineRow) {
    // Scroll into view
    lineRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Add highlight class (will be animated in Task 6)
    lineRow.classList.add('highlight-target');

    // Remove highlight after animation
    setTimeout(() => {
      lineRow.classList.remove('highlight-target');
    }, 2000);
  }
}
```

#### Make comment location clickable

Already added in Task 4's `renderComments()`:
```typescript
<span class="comment-location" onclick="navigateToComment('${comment.id}')">
```

### 3. PanelStateManager Updates

Add helper to find comment by ID:

```typescript
findCommentById(id: string): CommentInfo | undefined {
  return this.state.comments.find(c => c.id === id)
    || this.state.submittedHistory.find(c => c.id === id);
}
```

## Data Flow

```
User clicks comment location
        │
        ▼
navigateToComment(id) in webview
        │
        ▼
postMessage({ type: 'navigateToComment', id })
        │
        ▼
SidecarPanelAdapter.handleMessage()
        │
        ├── Find comment by ID
        ├── handleSelectFile(comment.file)  ← Opens diff
        └── postMessage({ type: 'scrollToLine', line })
                │
                ▼
        Webview receives scrollToLine
                │
                ├── Expand sidebar if collapsed
                ├── Find line row in diff
                └── scrollIntoView + highlight
```

## Considerations

1. **Chunk collapse**: If the target line is in a collapsed chunk, expand it first
2. **File not in changed list**: Handle case where comment's file has no diff
3. **Multi-line comments**: Scroll to start line (`comment.line`)
4. **Submitted comments**: Should also be navigable (read-only but can view)

## Additional Logic: Expand Collapsed Chunk

```typescript
function scrollToLineInDiff(lineNumber, commentId) {
  // ... existing code ...

  // Find which chunk contains this line
  const chunkBodies = diffContainer.querySelectorAll('tbody.chunk-lines');
  chunkBodies.forEach((chunk, index) => {
    const rows = chunk.querySelectorAll('tr[data-line]');
    rows.forEach(row => {
      if (parseInt(row.dataset.line) === lineNumber) {
        // Expand chunk if collapsed
        if (chunk.classList.contains('collapsed')) {
          toggleChunkCollapse(index);
        }
      }
    });
  });

  // Then scroll to line
  // ...
}
```

## Validation

- [ ] Clicking comment location sends `navigateToComment` message
- [ ] Extension receives message and selects file
- [ ] Webview receives `scrollToLine` message
- [ ] Sidebar expands if collapsed
- [ ] Diff scrolls to target line
- [ ] Collapsed chunks expand if target line is inside
- [ ] Works for both pending and submitted comments

## Test Scenarios

1. Click pending comment → diff opens, scrolls to line
2. Click submitted comment → diff opens, scrolls to line
3. Click comment when sidebar collapsed → sidebar expands, then navigates
4. Click comment in collapsed chunk → chunk expands, scrolls to line
5. Click comment for file not in changed list → graceful handling
