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
 * Render a single HN story item
 */
function renderHNStory(story: HNStory): string {
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
        ${stories.map((story) => renderHNStory(story)).join('')}
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

interface VSCodeAPI {
  postMessage(message: unknown): void;
}

/**
 * Setup HN feed event handlers
 * These are global window functions called from onclick attributes
 */
export function setupHNFeedHandlers(vscode: VSCodeAPI): void {
  (window as unknown as Record<string, unknown>).refreshHNFeed = function () {
    vscode.postMessage({ type: 'refreshHNFeed' });
  };

  (window as unknown as Record<string, unknown>).toggleFeed = function () {
    vscode.postMessage({ type: 'toggleFeed' });
  };

  (window as unknown as Record<string, unknown>).openHNStory = function (
    url: string,
    title: string
  ) {
    if (url) {
      vscode.postMessage({
        type: 'openHNStoryInPanel',
        url: url,
        title: title || 'HN Story',
      });
    }
  };

  (window as unknown as Record<string, unknown>).openHNComments = function (
    storyId: number
  ) {
    vscode.postMessage({ type: 'openHNComments', storyId: storyId });
  };
}
