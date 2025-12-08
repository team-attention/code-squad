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
