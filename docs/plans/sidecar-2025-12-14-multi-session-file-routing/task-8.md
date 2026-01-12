# Task 8: Update DiffHeader UI for Thread Badge

## Goal

Display the owner thread name as a badge in the diff header when multiple threads exist.

## Layer

Adapter

## Files

- `src/adapters/inbound/ui/webview/components/diff/DiffHeader.ts` - Modify component

## Implementation Steps

### 1. Update DiffHeaderProps

Add props for owner info and thread count:

```typescript
interface DiffHeaderProps {
    // ... existing props
    ownerThreadName?: string;
    multipleThreadsExist: boolean;  // threadCount > 1
}
```

### 2. Update Render Function

In the render function, add thread badge after file name:

```typescript
function renderDiffHeader(props: DiffHeaderProps): string {
    const { fileName, ownerThreadName, multipleThreadsExist, ...rest } = props;

    // Only show badge when multiple threads exist and owner is known
    const threadBadge = (multipleThreadsExist && ownerThreadName)
        ? `<span class="thread-badge">[${ownerThreadName}]</span>`
        : '';

    return `
        <div class="diff-header">
            <span class="file-name">${fileName}</span>
            ${threadBadge}
            <span class="file-stats">+${additions} -${deletions}</span>
        </div>
    `;
}
```

### 3. Add CSS Styling

Add styles for the thread badge:

```css
.thread-badge {
    margin-left: 8px;
    padding: 2px 6px;
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    background: var(--vscode-badge-background);
    border-radius: 3px;
}
```

### 4. Pass Props from Parent

Update the parent component that renders DiffHeader to pass:
- `ownerThreadName` from `FileInfo.ownerThreadName`
- `multipleThreadsExist` from `panelState.threadCount > 1`

## Test Scenarios

### TS6: DisplayOwnership - Show Thread Badge

```pseudo
// Arrange
props = {
  fileName: "src/app.ts",
  ownerThreadName: "Feature A",
  multipleThreadsExist: true
}

// Act
html = renderDiffHeader(props)

// Assert
expect(html).toContain('[Feature A]')
expect(html).toContain('thread-badge')
```

### TS7: DisplayOwnership - Hide Badge for Single Thread

```pseudo
// Arrange
props = {
  fileName: "src/app.ts",
  ownerThreadName: "Feature A",
  multipleThreadsExist: false  // Only one thread
}

// Act
html = renderDiffHeader(props)

// Assert
expect(html).not.toContain('[Feature A]')
expect(html).not.toContain('thread-badge')
```

## Visual Design

```
Before:
┌──────────────────────────────────────────────────┐
│ src/domain/entities/User.ts             +12 -5   │
└──────────────────────────────────────────────────┘

After (multiple threads):
┌──────────────────────────────────────────────────┐
│ src/domain/entities/User.ts [Thread A]  +12 -5   │
└──────────────────────────────────────────────────┘

After (single thread - no badge):
┌──────────────────────────────────────────────────┐
│ src/domain/entities/User.ts             +12 -5   │
└──────────────────────────────────────────────────┘
```

## Validation

- [ ] Thread badge renders when multiple threads exist
- [ ] Badge hidden for single thread
- [ ] Styling matches VSCode design language
- [ ] Test scenarios TS6, TS7 pass
- [ ] Type check passes
