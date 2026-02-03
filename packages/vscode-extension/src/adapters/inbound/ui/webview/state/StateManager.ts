/**
 * StateManager
 *
 * Centralized state management for webview UI.
 * Replaces global variables from script.ts with controlled state access.
 */

import type {
  WebviewState,
  SelectionState,
  UIState,
  SearchState,
  ViewState,
} from './types';

// Size limits for collections
export const MAX_COLLAPSED_FOLDERS = 1000;
export const MAX_SEARCH_MATCHES = 500;
export const MAX_HIGHLIGHT_ENTRIES = 10000;

export class StateManager {
  private state: WebviewState;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): WebviewState {
    return {
      selection: {
        selectedLineNum: null,
        selectedLineElement: null,
        selectionStartLine: null,
        selectionEndLine: null,
        selectionStartRow: null,
        selectionEndRow: null,
        isSelecting: false,
      },
      ui: {
        isResizing: false,
        sidebarWidth: 320,
        pendingScrollRestore: null,
        currentFile: null,
      },
      search: {
        currentSearchQuery: '',
        searchDebounceTimer: null,
        diffSearchQuery: '',
        diffSearchMatches: [],
        diffSearchCurrentIndex: -1,
      },
      view: {
        collapsedFolders: new Set(),
        scopedDiffCurrentFile: null,
        scopedDiffHighlightMap: new Map(),
        previewCurrentFile: null,
        previewDragStartBlock: null,
        previewDragEndBlock: null,
        previewIsDragging: false,
      },
    };
  }

  // Getters for read access
  getSelection(): SelectionState {
    return this.state.selection;
  }

  getUI(): UIState {
    return this.state.ui;
  }

  getSearch(): SearchState {
    return this.state.search;
  }

  getView(): ViewState {
    return this.state.view;
  }

  // Setters for controlled mutations
  setSelection(partial: Partial<SelectionState>): void {
    this.state.selection = { ...this.state.selection, ...partial };
  }

  setUI(partial: Partial<UIState>): void {
    this.state.ui = { ...this.state.ui, ...partial };
  }

  setSearch(partial: Partial<SearchState>): void {
    this.state.search = { ...this.state.search, ...partial };
  }

  setView(partial: Partial<ViewState>): void {
    this.state.view = { ...this.state.view, ...partial };
  }

  // Collection helpers with size limits
  addCollapsedFolder(folderPath: string): void {
    if (this.state.view.collapsedFolders.size >= MAX_COLLAPSED_FOLDERS) {
      const first = this.state.view.collapsedFolders.values().next().value;
      if (first) this.state.view.collapsedFolders.delete(first);
    }
    this.state.view.collapsedFolders.add(folderPath);
  }

  removeCollapsedFolder(folderPath: string): void {
    this.state.view.collapsedFolders.delete(folderPath);
  }

  // Cleanup
  reset(): void {
    // Clear collections
    this.state.view.collapsedFolders.clear();
    this.state.search.diffSearchMatches = [];
    this.state.view.scopedDiffHighlightMap.clear();

    // Reset to initial state
    this.state = this.getInitialState();
  }
}

// Export singleton instance (will be used by components)
export const stateManager = new StateManager();
