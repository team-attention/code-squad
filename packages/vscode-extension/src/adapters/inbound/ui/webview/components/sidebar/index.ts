/**
 * Sidebar Components
 */

export { renderAIStatus } from './AIStatus';
export type { AIStatusData } from './AIStatus';

export { setupFileSearchHandlers } from './FileSearch';
export type { FileSearchHandlers } from './FileSearch';

export {
  expandSidebar,
  collapseSidebar,
  setupSidebarToggle,
  setupResizer,
  getSidebarElements,
} from './Sidebar';
export type { SidebarState, SidebarElements } from './Sidebar';

export {
  renderComments,
  startEditComment,
  cancelEditComment,
  saveEditComment,
  deleteComment,
  navigateToComment,
  toggleSubmittedHistory,
  registerCommentHandlers,
} from './Comments';
export type { Comment, CommentHandlers } from './Comments';

export { renderFileList, buildFileTree } from './FileList';
export type {
  FileItem,
  DiffData,
  TreeNode,
  FileListProps,
  FileListHandlers,
} from './FileList';
