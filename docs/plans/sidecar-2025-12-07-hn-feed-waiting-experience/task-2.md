# Task 2: Add State Manager Methods for Feed Toggle

**Layer**: Application (services)
**Dependencies**: Task 1

## Goal

Add methods to `IPanelStateManager` and `PanelStateManager` to toggle the HN feed display state.

## Files to Modify

| File | Changes |
|------|---------|
| `src/application/services/IPanelStateManager.ts` | Add `setShowHNFeed(show: boolean)` and `toggleHNFeed()` |
| `src/application/services/PanelStateManager.ts` | Implement toggle methods |

## Test Scenarios

### TS-2.1: Set Show HN Feed
- **Given** `showHNFeed` is `false`
- **When** `setShowHNFeed(true)` is called
- **Then** state should update to `showHNFeed: true` and render

### TS-2.2: Toggle HN Feed On
- **Given** `showHNFeed` is `false`
- **When** `toggleHNFeed()` is called
- **Then** `showHNFeed` should become `true`

### TS-2.3: Toggle HN Feed Off
- **Given** `showHNFeed` is `true`
- **When** `toggleHNFeed()` is called
- **Then** `showHNFeed` should become `false`

### TS-2.4: Auto-Hide Feed on Diff Show
- **Given** user selects a file
- **When** `showDiff()` is called
- **Then** `showHNFeed` should be set to `false` (auto-hide feed)

## Implementation Guidance

### 1. Update IPanelStateManager Interface

In `src/application/services/IPanelStateManager.ts`, add methods (after line 77):

```typescript
export interface IPanelStateManager {
  // ... existing methods ...

  /**
   * Set whether to show the HN feed (for manual toggle)
   */
  setShowHNFeed(show: boolean): void;

  /**
   * Toggle HN feed visibility
   */
  toggleHNFeed(): void;
}
```

### 2. Implement in PanelStateManager

In `src/application/services/PanelStateManager.ts`, add methods (after line 500):

```typescript
setShowHNFeed(show: boolean): void {
  this.state = {
    ...this.state,
    showHNFeed: show,
  };
  this.render();
}

toggleHNFeed(): void {
  this.setShowHNFeed(!this.state.showHNFeed);
}
```

### 3. Modify showDiff() to Reset Feed Toggle

In `PanelStateManager.ts`, modify `showDiff()` (around line 146):

```typescript
showDiff(diff: DiffDisplayState, scopedDiff?: ScopedDiffDisplayState): void {
  // ... existing logic ...
  this.state = {
    ...this.state,
    diff,
    scopedDiff: scopedDiff || null,
    selectedFile: diff.file,
    diffViewMode: viewMode,
    showHNFeed: false,  // ADD: Auto-hide feed when showing diff
  };
  this.render();
}
```

## Validation

```bash
npm run compile
npm run lint
```

Ensure:
- No TypeScript errors
- Interface methods are properly implemented
- `showDiff()` properly resets the feed state
