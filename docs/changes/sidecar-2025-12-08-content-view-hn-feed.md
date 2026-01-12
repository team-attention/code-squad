# Changes: Content View for HN Feed

**Slug**: `sidecar-2025-12-08-content-view-hn-feed`
**Date**: 2025-12-08

## Summary

Removed the WebviewPanel-based article viewer and consolidated HN story links to use external browser only. This simplification reduces code complexity and avoids CSP (Content Security Policy) issues with iframe embedding.

## Changes

### Task 1: Remove Article WebviewPanel from SidecarPanelAdapter

**File**: `src/adapters/inbound/ui/SidecarPanelAdapter.ts`

Removed:
- `articlePanel` instance variable (line 89)
- `openHNStoryInPanel` message handler case (lines 241-242)
- `openArticleInWebview()` method (lines 722-763)
- `getArticleWebviewContent()` method (lines 765-841)
- `escapeHtml()` helper method (lines 843-850)
- `articlePanel` disposal code in `dispose()` (lines 897-903)

### Task 2: Update HNFeed.ts to Use External Browser

**File**: `src/adapters/inbound/ui/webview/components/waiting/HNFeed.ts`

Changes:
- Simplified `renderHNStory()` onclick handlers to only pass URL (removed title parameter)
- Updated `openHNStory` function in `setupHNFeedHandlers()` to send `openHNStory` message type instead of `openHNStoryInPanel`
- Removed unused `escapedTitleForAttr` variable

### Task 3: Update script.ts to Use External Browser

**File**: `src/adapters/inbound/ui/webview/script.ts`

Changes:
- Simplified `renderHNStory()` onclick handlers to only pass URL (removed title parameter)
- Updated `window.openHNStory` function to send `openHNStory` message type instead of `openHNStoryInPanel`
- Removed unused `escapedTitleForAttr` variable

## Flow After Changes

```
User clicks HN story title
      |
HNFeed.ts/script.ts: onclick calls openHNStory(url)
      |
window.openHNStory() sends 'openHNStory' message
      |
SidecarPanelAdapter.handleOpenHNStory()
      |
vscode.env.openExternal() - opens in browser
```

## Validation

- `npm run compile` - Passed (no TypeScript errors)
- `grep -r "articlePanel" src/` - No results (all references removed)
- `grep -r "openHNStoryInPanel" src/` - No results (all references removed)

## Manual Testing Required

1. Click HN story title in waiting screen - should open in external browser
2. Click HN story comments link - should open HN discussion in external browser
3. Verify waiting screen still displays correctly
4. Verify feed toggle still works
5. Verify refresh button still works

## Review

### Evaluation
- ✅ Spec compliance - HN stories now open in external browser as intended
- ✅ Architecture compliance - Changes only in `adapters/` layer
- ✅ Tests passing - N/A (no test changes)
- ✅ Build success - `npm run compile` passes
- ⚠️ Lint - ESLint config missing (pre-existing issue, not from this change)

### User Feedback
- User confirmed: "it opens up in external browser"
- Implementation works as expected

### Feedback
**What went well:**
- Clean removal of ~140 lines of unused WebviewPanel code
- Simplified message flow (removed `openHNStoryInPanel`, unified to `openHNStory`)
- No breaking changes to existing HN feed functionality

**What could be improved:**
- ESLint configuration should be restored (separate task)

### Friction
- None identified

### Next Actions
- Fix ESLint configuration (separate issue, not related to this change)
