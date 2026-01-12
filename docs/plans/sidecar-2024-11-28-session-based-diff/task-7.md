# Task 7: Add Toggle UI and Visual Distinction

## Goal

Add UI toggle to show/hide pre-session uncommitted files, with visual distinction.

## Dependencies

- Task 2 (PanelState with showUncommitted)
- Task 3 (PanelStateManager toggle methods)

## Files to Modify

1. `src/adapters/outbound/presenters/SidecarPanelAdapter.ts`

## Implementation

### SidecarPanelAdapter.ts

#### 1. Add CSS for visual distinction

Add to the `<style>` section:

```css
.file-item.uncommitted {
    background: var(--vscode-list-inactiveSelectionBackground, rgba(255, 255, 255, 0.04));
    opacity: 0.7;
}

.file-item.uncommitted::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--vscode-gitDecoration-untrackedResourceForeground, #73c991);
}

.toggle-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--vscode-panel-border);
}

.toggle-label {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
}

.toggle-switch {
    position: relative;
    width: 36px;
    height: 18px;
    background: var(--vscode-input-background);
    border-radius: 9px;
    cursor: pointer;
    transition: background 0.2s;
}

.toggle-switch.active {
    background: var(--vscode-button-background);
}

.toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    background: var(--vscode-foreground);
    border-radius: 50%;
    transition: transform 0.2s;
}

.toggle-switch.active::after {
    transform: translateX(18px);
}

.uncommitted-count {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 10px;
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
}
```

#### 2. Update HTML structure

Replace the files section in `getHtmlForWebview()`:

```html
<div class="section">
    <h3>Changed Files</h3>
    <div class="toggle-row" id="toggle-row" style="display: none;">
        <div class="toggle-switch" id="uncommitted-toggle"></div>
        <span class="toggle-label">Show pre-session files</span>
        <span class="uncommitted-count" id="uncommitted-count">0</span>
    </div>
    <div id="files-list">
        <div class="empty-text">Waiting for changes...</div>
    </div>
</div>
```

#### 3. Update message handler

Add toggle message handling in the webview message listener:

```javascript
case 'toggleUncommitted':
    // Handled by state manager via message
    break;
```

#### 4. Update JavaScript in webview

Update `renderFileList()` to handle both session and uncommitted files:

```javascript
function renderFileList(sessionFiles, uncommittedFiles, showUncommitted, selectedFile) {
    const list = document.getElementById('files-list');
    const toggleRow = document.getElementById('toggle-row');
    const toggleSwitch = document.getElementById('uncommitted-toggle');
    const countBadge = document.getElementById('uncommitted-count');

    // Show toggle only if there are uncommitted files
    if (uncommittedFiles && uncommittedFiles.length > 0) {
        toggleRow.style.display = 'flex';
        countBadge.textContent = uncommittedFiles.length;
        toggleSwitch.classList.toggle('active', showUncommitted);
    } else {
        toggleRow.style.display = 'none';
    }

    // Combine files for display
    const allFiles = [...(sessionFiles || [])];
    if (showUncommitted && uncommittedFiles) {
        allFiles.push(...uncommittedFiles.map(f => ({ ...f, isUncommitted: true })));
    }

    if (allFiles.length === 0) {
        list.innerHTML = '<div class="empty-text">Waiting for changes...</div>';
        return;
    }

    list.innerHTML = allFiles.map(file => {
        const isSelected = file.path === selectedFile;
        const statusBadge = file.status === 'added' ? 'A' : file.status === 'deleted' ? 'D' : 'M';
        const uncommittedClass = file.isUncommitted ? 'uncommitted' : '';
        return `
            <div class="file-item ${isSelected ? 'selected' : ''} ${uncommittedClass}" data-file="${file.path}">
                <span class="file-icon">📄</span>
                <span class="file-name" title="${file.path}">${file.name}</span>
                <span class="file-badge">${statusBadge}</span>
            </div>
        `;
    }).join('');

    // Add click handlers for file items
    list.querySelectorAll('.file-item').forEach(item => {
        item.onclick = () => {
            vscode.postMessage({ type: 'selectFile', file: item.dataset.file });
        };
    });
}

// Update renderState to pass new params
function renderState(state) {
    renderFileList(state.sessionFiles, state.uncommittedFiles, state.showUncommitted, state.selectedFile);
    renderComments(state.comments);
    renderAIStatus(state.aiStatus);
    renderDiff(state.diff, state.selectedFile);
}

// Toggle click handler
document.getElementById('uncommitted-toggle').addEventListener('click', () => {
    vscode.postMessage({ type: 'toggleUncommitted' });
});
```

#### 5. Handle toggle message in SidecarPanelAdapter

Add case in `onDidReceiveMessage`:

```typescript
case 'toggleUncommitted':
    if (this.panelStateManager) {
        this.panelStateManager.toggleShowUncommitted();
    }
    break;
```

Add `panelStateManager` reference:

```typescript
private panelStateManager: IPanelStateManager | undefined;

setUseCases(
    generateDiffUseCase: IGenerateDiffUseCase,
    addCommentUseCase: IAddCommentUseCase,
    onSubmitComments: () => void,
    panelStateManager?: IPanelStateManager  // NEW
): void {
    this.generateDiffUseCase = generateDiffUseCase;
    this.addCommentUseCase = addCommentUseCase;
    this.onSubmitComments = onSubmitComments;
    this.panelStateManager = panelStateManager;
}
```

## Visual Design

**Session files**: Normal appearance (current style)

**Uncommitted files** (when shown):
- Slightly faded (opacity 0.7)
- Green left border indicator
- Grouped after session files

**Toggle**:
- Hidden when no uncommitted files
- Shows count badge
- Switch-style toggle

## Validation

- [ ] Toggle is hidden when no uncommitted files
- [ ] Toggle shows count of uncommitted files
- [ ] Uncommitted files appear only when toggle is on
- [ ] Uncommitted files have visual distinction (faded + green border)
- [ ] Clicking toggle calls `panelStateManager.toggleShowUncommitted()`
- [ ] Files can still be selected/clicked
