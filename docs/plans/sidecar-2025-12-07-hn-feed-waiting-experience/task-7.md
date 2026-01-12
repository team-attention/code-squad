# Task 7: Implement Feed/Diff Toggle Button

**Layer**: Adapters (UI/webview)
**Dependencies**: Task 2, Task 4

## Goal

Add a "Feed" button to the diff view header that toggles back to the HN feed, and ensure file selection returns to diff view.

## Files to Modify

| File | Changes |
|------|---------|
| `src/adapters/inbound/ui/webview/script.ts` | Add toggle button render, handle click |
| `src/adapters/inbound/ui/SidecarPanelAdapter.ts` | Add `toggleFeed` message handler |

## Test Scenarios

### TS-7.1: Toggle to Feed
- **Given** diff view is showing
- **When** user clicks "Feed" button
- **Then** waiting screen with feed displays

### TS-7.2: Return to Diff via File Selection
- **Given** feed is showing (toggle mode)
- **When** user clicks a file in the file list
- **Then** diff view shows for that file

### TS-7.3: Toggle Button Visibility
- **Given** AI session ends
- **When** diff view renders
- **Then** "Feed" toggle button should not be visible

### TS-7.4: Button Only in Diff View
- **Given** waiting screen is showing
- **When** screen renders
- **Then** "Feed" toggle button should not appear (already showing feed)

## Implementation Guidance

### 1. Add Toggle Function in script.ts

Add to global window functions (around line 2700):

```typescript
(window as any).toggleFeed = function() {
  vscode.postMessage({ type: 'toggleFeed' });
};
```

### 2. Add Toggle Button to Diff Header

Find the diff header rendering code in `renderDiff()` (around line 1574 where stats are rendered). Add a Feed button:

```typescript
// In the header section of diff view, add toggle button
const feedToggleButton = state.aiStatus.active
  ? `<button class="feed-toggle-btn" onclick="toggleFeed()" title="Show HN Feed">📰</button>`
  : '';

// Include in header HTML
const headerHtml = `
  <div class="diff-header">
    <span class="file-name">${state.selectedFile}</span>
    ${feedToggleButton}
    <!-- other header elements -->
  </div>
`;
```

### 3. Add CSS for Toggle Button

In `src/adapters/inbound/ui/webview/styles.ts`, add (with Task 3 styles):

```css
.feed-toggle-btn {
  background: transparent;
  border: 1px solid var(--vscode-button-border, var(--vscode-contrastBorder));
  color: var(--vscode-foreground);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-left: auto;
}

.feed-toggle-btn:hover {
  background: var(--vscode-list-hoverBackground);
}
```

### 4. Add Message Handler in SidecarPanelAdapter

In `src/adapters/inbound/ui/SidecarPanelAdapter.ts`, add case in message switch (around line 240):

```typescript
case 'toggleFeed':
  this.panelStateManager?.toggleHNFeed();
  break;
```

### 5. Ensure File Selection Resets Feed Toggle

The `showDiff()` method modified in Task 2 already resets `showHNFeed` to `false`. Verify the file selection handler calls `showDiff()`:

```typescript
case 'selectFile':
  // This should eventually call panelStateManager.showDiff()
  // which resets showHNFeed to false
  break;
```

## UI Layout

### Diff View with Toggle Button

```
┌─────────────────────────────────────────┐
│  src/index.ts                      [📰] │  ← Toggle button (right side)
├─────────────────────────────────────────┤
│  @@ -10,6 +10,8 @@                      │
│  ...diff content...                     │
└─────────────────────────────────────────┘
```

### Waiting Screen (after toggle)

```
┌─────────────────────────────────────────┐
│         ◐                               │
│   Watching for changes...               │
│   ──────── Meanwhile ────────           │
│   [HN Stories...]                       │
│                                         │
│  File List (still visible in sidebar):  │
│   > src/index.ts                        │  ← Click returns to diff
│   > src/utils.ts                        │
└─────────────────────────────────────────┘
```

## Validation

```bash
npm run compile
npm run lint
```

Manual test:
1. Start AI session, make a file change
2. Verify diff view shows with "📰" button in header
3. Click "📰" button
4. Verify waiting screen with feed appears
5. Click a file in the file list
6. Verify diff view returns
7. End AI session
8. Verify "📰" button is no longer visible
