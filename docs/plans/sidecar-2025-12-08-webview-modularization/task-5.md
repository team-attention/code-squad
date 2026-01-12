# Task 5: Extract WaitingScreen Component

**Status**: Ready
**Estimated Time**: 1 hour
**Dependencies**: Task 4

## Objective

Extract the waiting screen rendering functionality into a separate component. This component displays when AI is active but no changes are available yet.

## Changes

### Files to Create

1. `/src/adapters/inbound/ui/webview/components/waiting/WaitingScreen.ts`

### Files to Modify

1. `/src/adapters/inbound/ui/webview/components/index.ts` - Add export
2. `/src/adapters/inbound/ui/webview/script.ts` - Import and use WaitingScreen component

## Implementation Steps

### Step 1: Create WaitingScreen Component

Create `/src/adapters/inbound/ui/webview/components/waiting/WaitingScreen.ts`:

```typescript
/**
 * Waiting Screen Component
 *
 * Displays a loading screen with HN feed when AI is active
 * but no file changes are available yet.
 */

import { renderHNFeed, HNStory, HNFeedStatus } from './HNFeed';

/**
 * Render the waiting screen with spinner and HN feed
 */
export function renderWaitingScreen(
  hnStories: HNStory[],
  hnFeedStatus: HNFeedStatus,
  hnFeedError: string | null
): string {
  const feedHtml = renderHNFeed(hnStories, hnFeedStatus, hnFeedError);

  return `
    <div class="waiting-screen">
      <div class="waiting-spinner"></div>
      <div class="waiting-message">Watching for file changes...</div>

      <div class="meanwhile-divider">Meanwhile</div>

      <div class="waiting-feed-container">
        ${feedHtml}
      </div>
    </div>
  `;
}

/**
 * Update the diff viewer to show waiting screen
 * This modifies the DOM directly (used by renderState)
 */
export function showWaitingScreen(
  hnStories: HNStory[],
  hnFeedStatus: HNFeedStatus,
  hnFeedError: string | null
): void {
  const header = document.querySelector('.diff-header-title');
  const stats = document.getElementById('diff-stats');
  const viewer = document.getElementById('diff-viewer');
  const diffToolbar = document.getElementById('diff-toolbar');

  if (header) header.textContent = 'Waiting for changes...';
  if (stats) stats.innerHTML = '';
  if (diffToolbar) diffToolbar.style.display = 'none';

  if (viewer) {
    viewer.innerHTML = renderWaitingScreen(hnStories, hnFeedStatus, hnFeedError);
  }
}
```

**Source**: Lines 2771-2796 of script.ts

### Step 2: Update Components Index

Modify `/src/adapters/inbound/ui/webview/components/index.ts`:

```typescript
/**
 * Component barrel export
 */

export { renderHNFeed, setupHNFeedHandlers } from './waiting/HNFeed';
export type { HNStory, HNFeedStatus } from './waiting/HNFeed';

export { renderWaitingScreen, showWaitingScreen } from './waiting/WaitingScreen';
```

### Step 3: Update script.ts to Use WaitingScreen Component

At the top of `/src/adapters/inbound/ui/webview/script.ts`, update import:

```typescript
import {
  renderHNFeed,
  setupHNFeedHandlers,
  renderWaitingScreen,
  showWaitingScreen,
  HNStory,
  HNFeedStatus
} from './components';
```

Then **remove** or **comment out** these function definitions in script.ts:
- Lines 2771-2796: `renderWaitingScreen()` function

### Step 4: Update Usage in renderState

In script.ts, find the `renderState` function (around line 428-429) where waiting screen is shown:

**Before:**
```typescript
if (shouldShowWaiting) {
  renderWaitingScreen(state.hnStories, state.hnFeedStatus, state.hnFeedError);
} else if (state.diffViewMode === 'scope' && state.scopedDiff) {
  // ...
}
```

**After:**
```typescript
if (shouldShowWaiting) {
  showWaitingScreen(state.hnStories, state.hnFeedStatus, state.hnFeedError);
} else if (state.diffViewMode === 'scope' && state.scopedDiff) {
  // ...
}
```

Note: We're using `showWaitingScreen` instead of `renderWaitingScreen` because the original code modifies the DOM directly. The `showWaitingScreen` function handles both rendering and DOM updates.

## Test Scenarios

### Test 1: Build Verification

**Given**: WaitingScreen component extracted
**When**: Run `npm run esbuild`
**Then**:
- Build completes successfully
- No TypeScript errors
- WaitingScreen code included in bundle

### Test 2: Waiting Screen Shows on AI Start

**Given**: No files changed yet
**When**: Start AI session (Claude Code, Codex, or Gemini)
**Then**:
- Waiting screen displays
- Spinner animation visible
- "Watching for file changes..." message shown

### Test 3: HN Feed Integration

**Given**: Waiting screen displayed
**When**: HN feed loads stories
**Then**:
- HN feed embedded in waiting screen
- Stories display correctly
- "Meanwhile" divider visible between spinner and feed

### Test 4: Transition from Waiting to Diff

**Given**: Waiting screen displayed
**When**: AI makes file changes
**Then**:
- Waiting screen replaced with file list and diff view
- No errors in transition

### Test 5: Waiting Screen with Feed Error

**Given**: Waiting screen displayed
**When**: HN feed fails to load
**Then**:
- Waiting screen still shows
- Feed error message displayed
- Retry button works

### Test 6: Auto-fetch HN Feed

**Given**: Panel first shown, no file selected
**When**: renderState called with no selected file
**Then**:
- HN feed auto-fetch triggered (if status is 'idle')
- Feed begins loading

### Test 7: Toggle Back to Waiting Screen

**Given**: Diff view shown with files
**When**: All changes undone, no files left
**Then**:
- Waiting screen appears again
- Feed state preserved

### Test 8: Waiting Screen Styling

**Given**: Waiting screen displayed
**When**: Inspect visual appearance
**Then**:
- Spinner centered
- Message properly styled
- Feed container scrollable if needed
- Layout responsive

## Acceptance Criteria

- ✅ WaitingScreen component created
- ✅ showWaitingScreen handles DOM updates
- ✅ renderWaitingScreen returns HTML string
- ✅ script.ts uses WaitingScreen component
- ✅ Build succeeds with no errors
- ✅ Waiting screen displays correctly
- ✅ HN feed integration works
- ✅ Transitions between states smooth
- ✅ No console errors
- ✅ No duplicate code

## Rollback

If issues occur:

```bash
git checkout src/adapters/inbound/ui/webview/script.ts
rm src/adapters/inbound/ui/webview/components/waiting/WaitingScreen.ts
npm run esbuild
```

## Notes

- WaitingScreen depends on HNFeed component (Task 4)
- Combines spinner UI with HN feed for better UX during waiting
- Auto-triggers HN feed fetch when panel first shown
- DOM manipulation isolated to `showWaitingScreen` function
- `renderWaitingScreen` is pure (returns HTML string)
- Used in two places: renderState and potentially feed toggle

## Verification Commands

```bash
# Build
npm run esbuild

# Check component in bundle
grep -c "waiting-screen" dist/webview.js

# Count usage
grep -c "WaitingScreen" src/adapters/inbound/ui/webview/script.ts

# TypeScript check
npm run compile
```
