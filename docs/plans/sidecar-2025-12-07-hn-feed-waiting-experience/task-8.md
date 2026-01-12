# Task 8: Wire Auto-Transition on File Change

**Layer**: Adapters (controllers), Application (services)
**Dependencies**: Task 1, Task 2

## Goal

Ensure the first file change automatically transitions from waiting screen to diff view, and subsequent changes update the file list without view disruption.

## Files to Modify

| File | Changes |
|------|---------|
| `src/adapters/inbound/controllers/FileWatchController.ts` | Verify auto-transition flow |
| `src/application/services/PanelStateManager.ts` | Ensure showHNFeed resets on showDiff |

## Test Scenarios

### TS-8.1: First File Change Auto-Transition
- **Given** waiting screen is showing
- **When** first file change is detected
- **Then** diff view automatically displays for that file

### TS-8.2: Subsequent File Changes
- **Given** already in diff view
- **When** new file changes are detected
- **Then** file list updates but view stays on current diff

### TS-8.3: Toggle to Feed then File Change
- **Given** user toggled to feed view (showHNFeed = true)
- **When** new file change is detected
- **Then** file list updates but feed remains visible (user explicitly requested feed)

### TS-8.4: File Selection After Toggle
- **Given** user toggled to feed
- **When** they select a file from file list
- **Then** `showHNFeed` resets to false and diff shows

## Implementation Guidance

### 1. Verify showDiff Resets showHNFeed

In `src/application/services/PanelStateManager.ts`, the `showDiff()` method (modified in Task 2) should include:

```typescript
showDiff(diff: DiffDisplayState, scopedDiff?: ScopedDiffDisplayState): void {
  // ... existing logic ...
  this.state = {
    ...this.state,
    diff,
    scopedDiff: scopedDiff || null,
    selectedFile: diff.file,
    diffViewMode: viewMode,
    showHNFeed: false,  // CRITICAL: Reset feed toggle when showing diff
  };
  this.render();
}
```

### 2. Review FileWatchController Flow

In `src/adapters/inbound/controllers/FileWatchController.ts`, the `notifyFileChange()` method (around line 405-442) handles file changes:

```typescript
async notifyFileChange(uri: vscode.Uri): Promise<void> {
  // ... existing logic ...

  // If no file currently selected, auto-select first file
  if (!this.panelStateManager.getSelectedFile()) {
    await this.selectAndShowDiff(relativePath);
  }
}
```

This flow should work correctly with our changes because:
1. When first file changes, `selectAndShowDiff()` is called
2. `selectAndShowDiff()` eventually calls `panelStateManager.showDiff()`
3. `showDiff()` sets `showHNFeed = false`
4. Webview re-renders, `shouldShowWaiting` becomes `false`, diff appears

### 3. Handle Edge Case: Feed Toggle Active

When user has explicitly toggled to feed (`showHNFeed = true`), file changes should NOT auto-switch back to diff. This is handled naturally because:

1. `notifyFileChange()` only auto-selects if no file is selected
2. When user toggled to feed, a file IS still selected (just not displayed)
3. Therefore, new file changes just update the file list

**However**, if this isn't the desired behavior (user wants new changes to NOT interrupt feed reading), verify the condition:

```typescript
// In notifyFileChange(), the condition should be:
if (!this.panelStateManager.getSelectedFile()) {
  // Auto-select and show diff
}
// NOT:
if (this.panelStateManager.getState().showHNFeed) {
  // Don't interrupt feed reading
}
```

### 4. Verify addSessionFile Doesn't Reset Feed

In `PanelStateManager`, `addSessionFile()` should NOT change `showHNFeed`:

```typescript
addSessionFile(file: FileInfo): void {
  // ... add file to list ...
  // DO NOT modify showHNFeed here
  this.render();
}
```

## Data Flow

### First File Change (Auto-Transition)

```
FileWatchController.notifyFileChange()
      |
Check: getSelectedFile() === null? YES
      |
selectAndShowDiff(file)
      |
PanelStateManager.showDiff(diff)
      |
state.showHNFeed = false (explicit reset)
state.diff = diffData
      |
render() → shouldShowWaiting = false → Diff View
```

### File Change After Toggle to Feed

```
User clicks "Feed" toggle
      |
PanelStateManager.toggleHNFeed() → showHNFeed = true
      |
render() → shouldShowWaiting = true → Feed View (file still selected)
      |
FileWatchController.notifyFileChange()
      |
Check: getSelectedFile() !== null (file is selected, just not displayed)
      |
addSessionFile(file) only (no showDiff call)
      |
render() → file list updates, feed stays visible
```

### User Selects File from Feed View

```
User clicks file in file list
      |
handleSelectFile(file)
      |
PanelStateManager.showDiff(diff)
      |
state.showHNFeed = false (reset)
      |
render() → shouldShowWaiting = false → Diff View
```

## Validation

```bash
npm run compile
npm run lint
```

Manual test:
1. Start AI session
2. Verify waiting screen appears
3. Make a file change (e.g., edit and save a file)
4. Verify auto-transition to diff view
5. Make another file change
6. Verify file list updates, current diff stays
7. Click "Feed" toggle
8. Verify feed appears
9. Make another file change
10. Verify file list updates, feed stays visible
11. Click a file in file list
12. Verify diff view returns
