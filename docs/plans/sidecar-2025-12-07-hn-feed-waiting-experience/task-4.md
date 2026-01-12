# Task 4: Implement Waiting Screen Renderer

**Layer**: Adapters (UI/webview)
**Dependencies**: Task 1, Task 3

## Goal

Modify rendering logic in script.ts to display the waiting screen with animation when AI is active but no files have changed yet, or when user toggles to feed view.

## Files to Modify

| File | Changes |
|------|---------|
| `src/adapters/inbound/ui/webview/script.ts` | Add `renderWaitingScreen()` function, modify condition logic |

## Test Scenarios

### TS-4.1: Show Waiting When No Files
- **Given** AI session is active (`aiStatus.active = true`)
- **And** no files changed (`sessionFiles.length === 0`)
- **When** render is called
- **Then** waiting screen with animation should display

### TS-4.2: Show Waiting When Feed Toggle Active
- **Given** AI session is active
- **And** `showHNFeed` is `true`
- **When** render is called
- **Then** waiting screen should display (even if files exist)

### TS-4.3: HN Stories in Waiting Screen
- **Given** waiting screen is showing
- **When** HN stories are loaded
- **Then** they should appear below the "Meanwhile" divider

### TS-4.4: Refresh Button
- **Given** waiting screen
- **When** Refresh button is clicked
- **Then** `refreshHNFeed` message should be sent to extension

## Implementation Guidance

### 1. Add renderWaitingScreen Function

In `src/adapters/inbound/ui/webview/script.ts`, add around line 2850:

```typescript
function renderWaitingScreen(state: PanelState): string {
  const feedHtml = renderHNFeed(state);

  return `
    <div class="waiting-screen">
      <div class="waiting-spinner"></div>
      <div class="waiting-message">Watching for changes...</div>

      <div class="meanwhile-divider">Meanwhile</div>

      <div class="waiting-feed-container">
        ${feedHtml}
      </div>

      <button class="waiting-refresh-btn" onclick="refreshHNFeed()">
        ↻ Refresh
      </button>
    </div>
  `;
}
```

### 2. Modify renderDiff() Condition

In `renderDiff()` function (around line 1515), add check at the beginning:

```typescript
function renderDiff(state: PanelState): void {
  const viewer = document.getElementById('diff-viewer');
  if (!viewer) return;

  // Check if waiting screen should be shown
  const shouldShowWaiting = state.aiStatus.active &&
    (state.sessionFiles.length === 0 || state.showHNFeed);

  if (shouldShowWaiting) {
    viewer.innerHTML = renderWaitingScreen(state);
    return;
  }

  // ... existing diff rendering logic ...
}
```

### 3. Add refreshHNFeed Function

Add to the global window functions (around line 2700):

```typescript
(window as any).refreshHNFeed = function() {
  vscode.postMessage({ type: 'refreshHNFeed' });
};
```

### 4. Reuse Existing HN Feed Rendering

The `renderHNFeed()` function already exists and handles:
- Loading state
- Error state
- Stories list

Ensure it's accessible from `renderWaitingScreen()`.

## Validation

```bash
npm run compile
npm run lint
```

Manual test:
1. Start an AI session (e.g., run claude in terminal)
2. Verify waiting animation appears
3. Wait for HN stories to load
4. Verify stories appear below "Meanwhile"
5. Click Refresh button
6. Verify loading state appears
