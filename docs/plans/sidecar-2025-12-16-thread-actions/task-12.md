# Task 12: ThreadListWebviewProvider - UI Buttons and Messages

## Goal

Add action buttons to thread items and handle new message types.

## Location

`src/adapters/inbound/ui/ThreadListWebviewProvider.ts`

## Changes

### HTML Template Updates

Update the thread item template in `getHtmlForWebview()`:

```html
<div class="thread-item ${isSelected ? 'selected' : ''}" data-id="${thread.threadId}">
  <span class="thread-status ${thread.status}">●</span>
  <span class="thread-name">${escapeHtml(thread.name)}</span>

  <!-- Action buttons (visible on hover) -->
  <div class="thread-actions">
    <button class="thread-action-btn rename-btn" title="Rename thread" data-id="${thread.threadId}">
      <span class="codicon codicon-edit"></span>
    </button>
    ${thread.worktreePath ? `
      <button class="thread-action-btn branch-btn" title="Switch branch" data-id="${thread.threadId}">
        <span class="codicon codicon-git-branch"></span>
      </button>
    ` : ''}
    <button class="thread-action-btn delete-btn" title="Delete thread" data-id="${thread.threadId}">
      <span class="codicon codicon-trash"></span>
    </button>
  </div>

  <button class="thread-terminal-btn" title="Open terminal" data-id="${thread.threadId}">⟩_</button>
</div>
```

### CSS Updates

```css
.thread-actions {
  display: none;
  position: absolute;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  gap: 4px;
}

.thread-item:hover .thread-actions {
  display: flex;
}

.thread-action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: var(--vscode-foreground);
  opacity: 0.7;
}

.thread-action-btn:hover {
  background: var(--vscode-toolbar-hoverBackground);
  opacity: 1;
}

.thread-action-btn.delete-btn:hover {
  color: var(--vscode-errorForeground);
}
```

### JavaScript Event Handlers

```javascript
// Add to the script section
document.addEventListener('click', (e) => {
  const renameBtn = e.target.closest('.rename-btn');
  const branchBtn = e.target.closest('.branch-btn');
  const deleteBtn = e.target.closest('.delete-btn');

  if (renameBtn) {
    e.stopPropagation();
    const threadId = renameBtn.dataset.id;
    vscode.postMessage({ type: 'renameThread', id: threadId });
    return;
  }

  if (branchBtn) {
    e.stopPropagation();
    const threadId = branchBtn.dataset.id;
    vscode.postMessage({ type: 'switchThreadBranch', id: threadId });
    return;
  }

  if (deleteBtn) {
    e.stopPropagation();
    const threadId = deleteBtn.dataset.id;
    vscode.postMessage({ type: 'deleteThread', id: threadId });
    return;
  }
});
```

### Message Handler Updates

Update `handleMessage()` to handle new message types:

```typescript
private async handleMessage(message: any): Promise<void> {
  switch (message.type) {
    // ... existing cases

    case 'deleteThread':
      await this.controller.deleteThread(message.id);
      break;

    case 'renameThread':
      await this.controller.renameThread(message.id);
      break;

    case 'switchThreadBranch':
      await this.controller.switchThreadBranch(message.id);
      break;
  }
}
```

### Thread Data Update

Ensure thread data includes `worktreePath` for conditional branch button rendering:

```typescript
interface ThreadItemData {
  threadId: string;
  name: string;
  status: string;
  worktreePath: string | null;
  // ... other fields
}
```

## Test Scenarios

UI tests are typically manual or use webview testing frameworks:

### UI1: Action buttons visible on hover
- **When**: Mouse hovers over thread item
- **Then**: Action buttons (rename, delete, branch if worktree) become visible

### UI2: Action buttons hidden on mouse leave
- **When**: Mouse leaves thread item
- **Then**: Action buttons hidden

### UI3: Branch button only for worktree threads
- **Given**: Thread with worktreePath
- **Then**: Branch button visible
- **Given**: Thread without worktreePath
- **Then**: Branch button not rendered

### UI4: Click action button doesn't select thread
- **When**: Click delete button
- **Then**: Delete message sent, thread not selected

### UI5: Delete button sends correct message
- **When**: Click delete button on thread "t1"
- **Then**: `{ type: 'deleteThread', id: 't1' }` posted

### UI6: Rename button sends correct message
- **When**: Click rename button on thread "t1"
- **Then**: `{ type: 'renameThread', id: 't1' }` posted

### UI7: Branch button sends correct message
- **When**: Click branch button on thread "t1"
- **Then**: `{ type: 'switchThreadBranch', id: 't1' }` posted

## Dependencies

- Task 11 (ThreadListController handlers)
