/**
 * Component barrel export
 */

export { renderHNFeed, setupHNFeedHandlers } from './waiting/HNFeed';
export type { HNStory, HNFeedStatus } from './waiting/HNFeed';

export { renderWaitingScreen, showWaitingScreen } from './waiting/WaitingScreen';

export {
  renderAIStatus,
  setupFileSearchHandlers,
  expandSidebar,
  collapseSidebar,
  setupSidebarToggle,
  setupResizer,
  getSidebarElements,
} from './sidebar';
export type {
  AIStatusData,
  FileSearchHandlers,
  SidebarState,
  SidebarElements,
} from './sidebar';

export { renderContentView, renderContentViewHeader } from './content';
export type { ContentViewProps } from './content';

export {
  performDiffSearch,
  highlightDiffMatches,
  clearDiffHighlights,
  updateCurrentMatch,
  navigateDiffSearch,
  updateNavButtons,
  updateMatchCounter,
  setupDiffSearchHandlers,
  getDiffSearchElements,
} from './diff';
export type {
  SearchMatch,
  DiffSearchState,
  DiffSearchElements,
} from './diff';

export {
  createPreviewSelectionState,
  clearPreviewSelection,
  setupPreviewCommentHandlers,
} from './markdown';
export type {
  PreviewSelectionState,
  PreviewCommentHandlers,
} from './markdown';
