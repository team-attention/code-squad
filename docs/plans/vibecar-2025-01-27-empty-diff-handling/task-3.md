# Task 3: Implement removeFile() in SidecarPanelAdapter

## Goal

Implement removeFile() method and add webview handler.

## File

`src/adapters/presenters/SidecarPanelAdapter.ts`

## Implementation

### 1. Add removeFile() method

```typescript
removeFile(file: string): void {
    this.panel.webview.postMessage({ type: 'fileRemoved', file });
}
```

### 2. Add webview message handler

In the `<script>` section, add case in message handler:

```javascript
case 'fileRemoved':
  removeFileFromList(message.file);
  break;
```

### 3. Add removeFileFromList function

```javascript
function removeFileFromList(filePath) {
  const list = document.getElementById('files-list');
  const item = Array.from(list.children).find(c => c.dataset.file === filePath);
  if (item) {
    item.remove();

    // If removed file was selected, clear diff viewer
    if (currentFile === filePath) {
      currentFile = '';
      document.querySelector('.diff-header-title').textContent = 'Select a file to review';
      document.getElementById('diff-stats').innerHTML = '';
      document.getElementById('diff-viewer').innerHTML = `
        <div class="placeholder">
          <div class="placeholder-icon">📝</div>
          <div class="placeholder-text">Select a modified file to view changes</div>
        </div>
      `;
    }

    // Show empty state if no files left
    if (list.children.length === 0) {
      list.innerHTML = '<div class="empty-text">Waiting for changes...</div>';
    }
  }
}
```

## Acceptance Criteria

- [ ] `removeFile()` method implemented
- [ ] Webview handles `fileRemoved` message
- [ ] File removed from list UI
- [ ] Diff viewer cleared if removed file was selected
- [ ] Empty state shown if no files remain
