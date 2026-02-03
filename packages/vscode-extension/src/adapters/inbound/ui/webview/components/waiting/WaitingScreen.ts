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
  hnFeedError: string | null,
  hasMore: boolean = true,
  loadingMore: boolean = false
): string {
  const feedHtml = renderHNFeed(hnStories, hnFeedStatus, hnFeedError, hasMore, loadingMore);

  return `
    <div class="waiting-screen">
      <div class="layout-guide">
        <div class="layout-hint">Recommended Layout</div>
        <div class="layout-diagram">
┌───────────────────────────────┐
│           VS Code             │
├────────────┬──────────────────┤
│            │                  │
│  Terminal  │                  │
│ (AI Agent) │   Code Squad     │
│            │                  │
│            │                  │
└────────────┴──────────────────┘
        </div>
        <div class="layout-tip">
          Tip: Run <code>Terminal: Create New Terminal in Editor Area</code> command
        </div>
      </div>

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
  hnFeedError: string | null,
  hasMore: boolean = true,
  loadingMore: boolean = false
): void {
  const header = document.querySelector('.diff-header-title');
  const stats = document.getElementById('diff-stats');
  const viewer = document.getElementById('diff-viewer');
  const diffToolbar = document.getElementById('diff-toolbar');

  if (header) header.textContent = '';
  if (stats) stats.innerHTML = '';
  if (diffToolbar) diffToolbar.style.display = 'none';

  if (viewer) {
    viewer.innerHTML = renderWaitingScreen(hnStories, hnFeedStatus, hnFeedError, hasMore, loadingMore);
  }
}
