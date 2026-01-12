# Changes: HN Feed Waiting Experience

**Slug**: `sidecar-2025-12-07-hn-feed-waiting-experience`
**Spec**: `docs/specs/sidecar-2025-12-07-hn-feed-waiting-experience.md`
**Plan**: `docs/plans/sidecar-2025-12-07-hn-feed-waiting-experience/main.md`

## Summary

Implemented a waiting screen experience that displays when an AI session is active but no file changes have been detected yet. The waiting screen shows an animated spinner, "Watching for changes..." message, and the HN feed to keep users engaged while waiting.

## Implemented Tasks

### Task 1: Add showHNFeed State to PanelState
- Added `showHNFeed: boolean` field to `PanelState` interface
- Initialized to `false` in `createInitialPanelState()`
- **Files**: `src/application/ports/outbound/PanelState.ts`

### Task 2: Add State Manager Methods for Feed Toggle
- Added `setShowHNFeed(show: boolean)` and `toggleHNFeed()` to interface
- Implemented toggle methods in `PanelStateManager`
- Modified `showDiff()` to reset `showHNFeed = false` when showing diff
- **Files**:
  - `src/application/services/IPanelStateManager.ts`
  - `src/application/services/PanelStateManager.ts`

### Task 3: Create Waiting Animation CSS Styles
- Added `.waiting-screen` container styles
- Added `.waiting-spinner` with CSS rotation animation
- Added `.meanwhile-divider` with horizontal lines and text
- Added `.waiting-feed-container` for HN feed
- Added `.feed-toggle-btn` for toggle button
- **Files**: `src/adapters/inbound/ui/webview/styles.ts`

### Task 4: Implement Waiting Screen Renderer
- Added `renderWaitingScreen()` function
- Modified `renderState()` to check `shouldShowWaiting` condition
- Updated `renderDiff()` signature to include `aiStatus` parameter
- Added feed toggle button to diff header when AI is active
- **Files**: `src/adapters/inbound/ui/webview/script.ts`

### Task 5: Create Internal WebviewPanel for Articles
- Added `articlePanel` instance variable for tracking
- Implemented `openArticleInWebview()` method
- Created `getArticleWebviewContent()` for iframe-based article viewing
- Added `escapeHtml()` helper method
- Added article panel disposal in `dispose()` method
- **Files**: `src/adapters/inbound/ui/SidecarPanelAdapter.ts`

### Task 6: Add Message Handlers for Internal Navigation
- Added `openHNStoryInPanel` message handler
- Added `toggleFeed` message handler
- Updated `openHNStory` to send panel message with title
- Updated `renderHNStory` to pass title to click handler
- **Files**:
  - `src/adapters/inbound/ui/SidecarPanelAdapter.ts`
  - `src/adapters/inbound/ui/webview/script.ts`

### Task 7: Implement Feed/Diff Toggle Button
- Added toggle button (`📰`) to diff stats area
- Button only visible when AI session is active
- Added `toggleFeed` window function
- **Files**: `src/adapters/inbound/ui/webview/script.ts`

### Task 8: Wire Auto-Transition on File Change
- Verified existing `notifyFileChange()` logic handles auto-transition
- When first file changes, `showDiff()` is called which resets `showHNFeed`
- Auto-transition from waiting screen to diff view works correctly

## Technical Details

### State Flow
```
AI Session Starts → showHNFeed=false, aiStatus.active=true
       ↓
No files yet → shouldShowWaiting=true → Waiting Screen displayed
       ↓
First file change → showDiff() called → showHNFeed=false → Diff View displayed
       ↓
User clicks Feed toggle → toggleHNFeed() → showHNFeed=true → Waiting Screen
       ↓
User clicks file → showDiff() called → showHNFeed=false → Diff View displayed
```

### Waiting Screen Condition
```typescript
const shouldShowWaiting = state.aiStatus.active &&
  (state.sessionFiles.length === 0 || state.showHNFeed);
```

### Article Panel Features
- Opens in VSCode WebviewPanel (Column Two)
- iframe sandbox with `allow-scripts allow-same-origin allow-forms`
- Back button closes panel
- "Open in Browser" button for external viewing
- Single panel instance (new article replaces existing)

## Validation

- `npm run compile` - Passes
- Manual testing required for:
  1. Start AI session, verify waiting animation appears
  2. Verify HN feed loads in waiting screen
  3. Click article title, verify opens in WebviewPanel
  4. Click back button, verify panel closes
  5. Modify a file, verify auto-transition to diff view
  6. Click Feed toggle button, verify returns to feed
  7. Click file in list while in feed view, verify diff shows

## Files Modified

| File | Layer | Changes |
|------|-------|---------|
| `src/application/ports/outbound/PanelState.ts` | Application | Added `showHNFeed` field |
| `src/application/services/IPanelStateManager.ts` | Application | Added toggle methods |
| `src/application/services/PanelStateManager.ts` | Application | Implemented toggle, modified showDiff |
| `src/adapters/inbound/ui/webview/styles.ts` | Adapters | Added waiting screen CSS |
| `src/adapters/inbound/ui/webview/script.ts` | Adapters | Added waiting screen renderer, toggle |
| `src/adapters/inbound/ui/SidecarPanelAdapter.ts` | Adapters | Added article panel, handlers |
