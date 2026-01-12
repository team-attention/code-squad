# Task 4: Extract HN Feed Component

**Status**: Ready
**Estimated Time**: 1 hour
**Dependencies**: Task 3

## Objective

Extract the Hacker News feed rendering functionality into a separate component. This is the least coupled component, making it ideal for the first component extraction.

## Changes

### Files to Create

1. `/src/adapters/inbound/ui/webview/components/waiting/HNFeed.ts`

### Files to Modify

1. `/src/adapters/inbound/ui/webview/components/index.ts` - Add export
2. `/src/adapters/inbound/ui/webview/script.ts` - Import and use HNFeed component

## Implementation Steps

### Step 1: Create HN Feed Component

Create `/src/adapters/inbound/ui/webview/components/waiting/HNFeed.ts`:

```typescript
/**
 * Hacker News Feed Component
 *
 * Renders Hacker News stories in the webview.
 * Used in waiting screen and feed toggle.
 */

import { escapeHtml } from '../../utils/dom';

export interface HNStory {
  id: number;
  title: string;
  url: string;
  discussionUrl: string;
  score: number;
  descendants: number;
  domain?: string;
  timeAgo: string;
}

export type HNFeedStatus = 'idle' | 'loading' | 'error';

/**
 * Render the complete HN feed with header and stories
 */
export function renderHNFeed(
  stories: HNStory[],
  status: HNFeedStatus,
  error: string | null
): string {
  const isLoading = status === 'loading';

  let content = '';

  if (status === 'loading') {
    content = `
      <div class="hn-loading">
        <div class="hn-loading-spinner"></div>
        <div>Loading stories...</div>
      </div>
    `;
  } else if (status === 'error') {
    content = `
      <div class="hn-error">
        <div class="hn-error-icon">⚠️</div>
        <div class="hn-error-message">${escapeHtml(error || 'Failed to load stories')}</div>
        <div class="hn-error-retry">
          <button class="hn-refresh-btn" onclick="refreshHNFeed()">
            <span class="refresh-icon">↻</span> Retry
          </button>
        </div>
      </div>
    `;
  } else if (!stories || stories.length === 0) {
    content = `
      <div class="hn-empty">
        <div>No stories available</div>
        <button class="hn-refresh-btn" onclick="refreshHNFeed()">
          <span class="refresh-icon">↻</span> Load Stories
        </button>
      </div>
    `;
  } else {
    content = `
      <div class="hn-story-list">
        ${stories.map((story, index) => renderHNStory(story, index)).join('')}
      </div>
    `;
  }

  return `
    <div class="hn-feed">
      <div class="hn-feed-header">
        <div class="hn-feed-title">
          <span class="hn-icon">Y</span>
          <span>Hacker News</span>
        </div>
        <button class="hn-refresh-btn ${isLoading ? 'loading' : ''}" onclick="refreshHNFeed()" ${isLoading ? 'disabled' : ''}>
          <span class="refresh-icon">↻</span> Refresh
        </button>
      </div>
      ${content}
    </div>
  `;
}

/**
 * Render a single HN story item
 */
function renderHNStory(story: HNStory, index: number): string {
  const domainDisplay = story.domain
    ? `<span class="hn-story-domain">(${escapeHtml(story.domain)})</span>`
    : '';
  const storyUrl = story.url || story.discussionUrl;

  // Escape title for use in onclick attribute (escape both HTML and quotes)
  const escapedTitleForAttr = escapeHtml(story.title).replace(/'/g, "\\'");

  return `
    <div class="hn-story">
      <span class="hn-story-title" onclick="openHNStory('${escapeHtml(storyUrl)}', '${escapedTitleForAttr}')" title="${escapeHtml(story.title)}">
        ${escapeHtml(story.title)}
      </span>
      <div class="hn-story-meta">
        <span class="hn-story-score">▲ ${story.score}</span>
        <span class="hn-story-comments" onclick="openHNStory('${escapeHtml(story.discussionUrl)}', '${escapedTitleForAttr} - HN Discussion')">
          💬 ${story.descendants} comments
        </span>
        ${domainDisplay}
        <span class="hn-story-time">${escapeHtml(story.timeAgo)}</span>
      </div>
    </div>
  `;
}

/**
 * Setup HN feed event handlers
 * These are global window functions called from onclick attributes
 */
export function setupHNFeedHandlers(vscode: any): void {
  (window as any).refreshHNFeed = function() {
    vscode.postMessage({ type: 'refreshHNFeed' });
  };

  (window as any).toggleFeed = function() {
    vscode.postMessage({ type: 'toggleFeed' });
  };

  (window as any).openHNStory = function(url: string, title: string) {
    if (url) {
      vscode.postMessage({ type: 'openHNStoryInPanel', url: url, title: title || 'HN Story' });
    }
  };

  (window as any).openHNComments = function(storyId: number) {
    vscode.postMessage({ type: 'openHNComments', storyId: storyId });
  };
}
```

**Source**: Lines 2798-2895 of script.ts

### Step 2: Update Components Index

Modify `/src/adapters/inbound/ui/webview/components/index.ts`:

```typescript
/**
 * Component barrel export
 */

export { renderHNFeed, setupHNFeedHandlers } from './waiting/HNFeed';
export type { HNStory, HNFeedStatus } from './waiting/HNFeed';
```

### Step 3: Update script.ts to Use HNFeed Component

At the top of `/src/adapters/inbound/ui/webview/script.ts`, add import:

```typescript
import { renderHNFeed, setupHNFeedHandlers, HNStory, HNFeedStatus } from './components';
```

Then **remove** or **comment out** these function definitions in script.ts:
- Lines 2798-2854: `renderHNFeed()` function
- Lines 2856-2877: `renderHNStory()` function
- Lines 2879-2895: Window function definitions for HN feed

**Keep** the types if they're defined in script.ts, or rely on the imported types.

### Step 4: Setup HN Handlers on Init

In script.ts, after the vscode constant definition (around line 2), add:

```typescript
const vscode = acquireVsCodeApi();

// Setup HN feed handlers
setupHNFeedHandlers(vscode);
```

This ensures the global window functions are available for the onclick handlers.

### Step 5: Verify Usage Sites

Search script.ts for calls to `renderHNFeed`:

1. Line 782 (in `renderWaitingScreen`): `const feedHtml = renderHNFeed(hnStories, hnFeedStatus, hnFeedError);`
2. Line 1527 (in `renderDiff`): `viewer.innerHTML = renderHNFeed(hnStories, hnFeedStatus, hnFeedError);`

Both should work with the imported function.

## Test Scenarios

### Test 1: Build Verification

**Given**: HNFeed component extracted
**When**: Run `npm run esbuild`
**Then**:
- Build completes successfully
- No TypeScript errors
- HNFeed code included in bundle

### Test 2: HN Feed Renders (Idle State)

**Given**: Extension loaded, no AI session active
**When**: Open Sidecar panel
**Then**:
- HN feed shows "No stories available"
- "Load Stories" button visible
- No console errors

### Test 3: HN Feed Renders (Loading State)

**Given**: HN feed in loading state
**When**: Click "Load Stories" button
**Then**:
- Loading spinner appears
- "Loading stories..." text displayed
- Refresh button disabled

### Test 4: HN Feed Renders (Success State)

**Given**: HN feed loaded successfully
**When**: Stories received from extension
**Then**:
- Story list renders correctly
- All story metadata visible (title, score, comments, domain, time)
- Story titles are clickable

### Test 5: HN Feed Renders (Error State)

**Given**: HN feed loading failed
**When**: Error received from extension
**Then**:
- Error icon displayed
- Error message shown
- "Retry" button available

### Test 6: Click Story Title

**Given**: HN feed with stories
**When**: Click a story title
**Then**:
- `openHNStory` message sent to extension
- Story URL and title passed correctly

### Test 7: Click Comments

**Given**: HN feed with stories
**When**: Click comments link
**Then**:
- `openHNStory` message sent with discussion URL
- Opens HN discussion page

### Test 8: Refresh Feed

**Given**: HN feed displayed
**When**: Click refresh button
**Then**:
- `refreshHNFeed` message sent to extension
- Loading state activated

### Test 9: Waiting Screen Integration

**Given**: AI session active, no changes yet
**When**: Webview renders waiting screen
**Then**:
- HN feed embedded in waiting screen
- Feed renders correctly
- All interactions work

### Test 10: Toggle Feed

**Given**: Diff view with toggle feed button
**When**: Click feed toggle button
**Then**:
- `toggleFeed` message sent
- Feed visibility toggles

## Acceptance Criteria

- ✅ HNFeed component created in separate file
- ✅ All HN feed functions moved to component
- ✅ script.ts imports and uses component
- ✅ Build succeeds with no errors
- ✅ All HN feed states render correctly (idle, loading, error, success)
- ✅ All interactions work (refresh, click story, click comments)
- ✅ Waiting screen integration works
- ✅ No console errors
- ✅ No duplicate code

## Rollback

If issues occur:

1. Remove import from script.ts
2. Uncomment original HN feed functions in script.ts
3. Delete HNFeed.ts
4. Rebuild

```bash
git checkout src/adapters/inbound/ui/webview/script.ts
rm src/adapters/inbound/ui/webview/components/waiting/HNFeed.ts
npm run esbuild
```

## Notes

- HN feed is completely isolated - no dependencies on other components
- Uses only `escapeHtml` utility
- All interactions via window functions (onclick attributes)
- State (stories, status, error) passed from parent
- No direct DOM manipulation - returns HTML strings
- Types exported for reuse
- setupHNFeedHandlers must be called once on init to register window functions

## Verification Commands

```bash
# Build
npm run esbuild

# Check HNFeed in bundle
grep -c "renderHNFeed" dist/webview.js

# Count HNFeed usage
grep -c "renderHNFeed" src/adapters/inbound/ui/webview/script.ts

# TypeScript check
npm run compile
```
