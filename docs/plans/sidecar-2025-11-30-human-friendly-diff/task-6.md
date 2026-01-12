# Task 6: Add Status Badge Colors

**Requirement**: R1.3
**Layer**: Adapters (Inbound/UI)
**Dependencies**: Task 2 (Fix File Status Detection)

## Goal

Add colored badges for file status:
- `A` (Added): Green badge
- `M` (Modified): Yellow/Orange badge
- `D` (Deleted): Red badge

## Files to Modify

| File | Changes |
|------|---------|
| `src/adapters/inbound/ui/SidecarPanelAdapter.ts` | Update CSS and badge rendering |

## Implementation Steps

### Step 1: Update CSS Styles

```css
/* Replace existing .file-badge style */

.file-badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 10px;
    font-weight: 600;
    text-transform: uppercase;
}

.file-badge.added {
    background: var(--vscode-gitDecoration-addedResourceForeground, #238636);
    color: var(--vscode-editor-background, white);
}

.file-badge.modified {
    background: var(--vscode-gitDecoration-modifiedResourceForeground, #d29922);
    color: var(--vscode-editor-background, black);
}

.file-badge.deleted {
    background: var(--vscode-gitDecoration-deletedResourceForeground, #f85149);
    color: var(--vscode-editor-background, white);
}
```

### Step 2: Update renderFileList Function

```javascript
// In renderFileList function

list.innerHTML = allFiles.map(file => {
    const isSelected = file.path === selectedFile;

    // Determine badge text and class based on status
    let badgeText = 'M';
    let badgeClass = 'modified';
    if (file.status === 'added') {
        badgeText = 'A';
        badgeClass = 'added';
    } else if (file.status === 'deleted') {
        badgeText = 'D';
        badgeClass = 'deleted';
    }

    const uncommittedClass = file.isUncommitted ? 'uncommitted' : '';

    return `
        <div class="file-item ${isSelected ? 'selected' : ''} ${uncommittedClass}" data-file="${file.path}">
            <span class="file-icon">📄</span>
            <span class="file-name" title="${file.path}">${file.name}</span>
            <span class="file-badge ${badgeClass}">${badgeText}</span>
        </div>
    `;
}).join('');
```

## Color Reference

| Status | Badge | Background Color | VSCode Theme Variable |
|--------|-------|-----------------|----------------------|
| Added | `A` | Green (#238636) | `gitDecoration-addedResourceForeground` |
| Modified | `M` | Orange (#d29922) | `gitDecoration-modifiedResourceForeground` |
| Deleted | `D` | Red (#f85149) | `gitDecoration-deletedResourceForeground` |

## Validation

```bash
npm run compile
# Manual test: Create new file → should show green 'A' badge
# Manual test: Modify existing file → should show orange 'M' badge
# Manual test: Delete file (if supported) → should show red 'D' badge
```

## Architecture Compliance

- UI changes only in Inbound Adapter (SidecarPanelAdapter) ✓
- Uses VSCode theme variables for consistency ✓
