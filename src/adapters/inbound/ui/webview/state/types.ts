/**
 * Webview UI State Types
 *
 * All state managed by the webview client-side.
 * This is separate from application state sent from the extension.
 */

export interface SelectionState {
  selectedLineNum: number | null;
  selectedLineElement: HTMLElement | null;
  selectionStartLine: number | null;
  selectionEndLine: number | null;
  selectionStartRow: HTMLElement | null;
  selectionEndRow: HTMLElement | null;
  isSelecting: boolean;
}

export interface UIState {
  isResizing: boolean;
  sidebarWidth: number;
  pendingScrollRestore: number | null;
  currentFile: string | null;
}

export interface SearchState {
  // File search
  currentSearchQuery: string;
  searchDebounceTimer: number | null;

  // Diff search
  diffSearchQuery: string;
  diffSearchMatches: any[];
  diffSearchCurrentIndex: number;
}

export interface ViewState {
  // Tree view
  collapsedFolders: Set<string>;

  // Scoped diff
  scopedDiffCurrentFile: string | null;
  scopedDiffHighlightMap: Map<number, string>;

  // Preview comment
  previewCurrentFile: string | null;
  previewDragStartBlock: HTMLElement | null;
  previewDragEndBlock: HTMLElement | null;
  previewIsDragging: boolean;
}

export interface WebviewState {
  selection: SelectionState;
  ui: UIState;
  search: SearchState;
  view: ViewState;
}
