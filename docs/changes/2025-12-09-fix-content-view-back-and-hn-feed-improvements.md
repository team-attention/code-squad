# Fix: Content View Back Button and HN Feed Improvements

## Problem

1. **Content view back button not working**: When clicking back button in content view, only the title changed to "Waiting for changes..." but the content (iframe) remained visible
2. **HN feed not using full height**: The feed container was limited to 60vh
3. **No pagination for HN stories**: Only 20 stories loaded with no way to load more

## Research

### Content View Back Button Issue
- `renderContentViewState()` replaces entire `viewerHeader.innerHTML` with content view structure
- This removes `#diff-stats` and `#toggle-sidebar` elements from default header
- After `closeContentView()`, `renderWaitingScreen()` tries to find `#diff-stats` which no longer exists
- Header structure is corrupted, causing rendering to fail silently

### HN Feed Height Issue
- `.waiting-feed-container` had `max-height: 60vh` limiting vertical space
- `.waiting-screen` didn't have explicit height

## Root Cause

1. **Back button**: Header structure mutation without restoration mechanism
2. **Height**: Fixed max-height constraint instead of flex-based layout
3. **Pagination**: UseCase only fetched 20 stories with no loadMore capability

## Solution

### 1. Content View Back Button Fix
Added `ensureDefaultHeaderStructure()` function that:
- Checks if default header structure exists (using `#diff-stats` as indicator)
- Restores full header HTML if corrupted
- Re-attaches toggle button event listener
- Called at start of `renderWaitingScreen()`, `renderDiff()`, `renderScopedDiff()`

### 2. HN Feed Full Height
- Changed `.waiting-screen` to `height: 100%`
- Changed `.waiting-feed-container` from `max-height: 60vh` to `flex: 1; min-height: 0`

### 3. Load More Pagination
- Extended `FetchHNStoriesUseCase` with `loadMore()` method
- Added `hnHasMore` and `hnLoadingMore` to PanelState
- Added "Load More" button at bottom of story list
- Loads 20 stories per page, up to 100 total

## Files Changed

### Content View Fix
- `src/adapters/inbound/ui/webview/script.ts` - Added `ensureDefaultHeaderStructure()`, called in render functions

### HN Feed Height
- `src/adapters/inbound/ui/webview/styles.ts` - Updated `.waiting-screen` and `.waiting-feed-container`

### Load More Pagination
- `src/application/ports/inbound/IFetchHNStoriesUseCase.ts` - Added `loadMore()`, `hasMore` to result
- `src/application/useCases/FetchHNStoriesUseCase.ts` - Implemented pagination with cached story IDs
- `src/application/ports/outbound/PanelState.ts` - Added `hnHasMore`, `hnLoadingMore`
- `src/application/services/IPanelStateManager.ts` - Added `setHNLoadingMore()`
- `src/application/services/PanelStateManager.ts` - Implemented new state management
- `src/adapters/inbound/ui/SidecarPanelAdapter.ts` - Added `loadMoreHNFeed` message handler
- `src/adapters/inbound/ui/webview/components/waiting/HNFeed.ts` - Added Load More button
- `src/adapters/inbound/ui/webview/components/waiting/WaitingScreen.ts` - Pass new params
- `src/adapters/inbound/ui/webview/script.ts` - Added `loadMoreHNFeed` global function
- `src/adapters/inbound/ui/webview/styles.ts` - Added Load More button styles

## Validation
- ✅ Compile
- ✅ Back button now properly returns to waiting screen
- ✅ HN feed uses full available height
- ✅ Load More button appears and loads additional stories
