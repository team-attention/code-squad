/**
 * Line Selection Component
 *
 * Handle line selection for adding comments in diff views.
 */

export interface SelectionState {
  startLine: number | null;
  endLine: number | null;
  startRow: HTMLElement | null;
  endRow: HTMLElement | null;
  isSelecting: boolean;
}

export interface SelectionRange {
  startLine: number;
  endLine: number;
}

export interface LineSelectionHandlers {
  onCommentButtonClick: (lineNum: number, lineElement: HTMLElement) => void;
  onSelectionComplete: (range: SelectionRange, lineElement: HTMLElement) => void;
}

/**
 * Create initial selection state
 */
export function createSelectionState(): SelectionState {
  return {
    startLine: null,
    endLine: null,
    startRow: null,
    endRow: null,
    isSelecting: false,
  };
}

/**
 * Get row type (addition, deletion, context)
 */
function getRowType(row: HTMLElement | null): 'addition' | 'deletion' | 'context' | null {
  if (!row) return null;
  return row.classList.contains('addition')
    ? 'addition'
    : row.classList.contains('deletion')
      ? 'deletion'
      : 'context';
}

/**
 * Check if line is selectable (not a deletion)
 */
export function isSelectableLine(row: HTMLElement): boolean {
  return !row.classList.contains('deletion');
}

/**
 * Clear all line selection highlighting
 */
export function clearLineSelection(): void {
  document.querySelectorAll('.diff-line.line-selected').forEach((el) => {
    el.classList.remove('line-selected', 'selection-start', 'selection-end');
  });
}

/**
 * Update visual line selection based on current range
 */
export function updateLineSelection(
  startLine: number | null,
  endLine: number | null
): void {
  clearLineSelection();
  if (startLine === null || endLine === null) return;

  const normalizedStart = Math.min(startLine, endLine);
  const normalizedEnd = Math.max(startLine, endLine);

  const rowsByLineNum = new Map<number, HTMLElement[]>();
  document.querySelectorAll('.diff-line').forEach((row) => {
    const lineNum = parseInt((row as HTMLElement).dataset.line || '0');
    if (lineNum >= normalizedStart && lineNum <= normalizedEnd) {
      if (!rowsByLineNum.has(lineNum)) {
        rowsByLineNum.set(lineNum, []);
      }
      rowsByLineNum.get(lineNum)!.push(row as HTMLElement);
    }
  });

  const selectedRows: Array<{ row: HTMLElement; lineNum: number }> = [];
  rowsByLineNum.forEach((rows, lineNum) => {
    for (const row of rows) {
      const rowType = getRowType(row);
      if (rowType === 'deletion') continue;
      row.classList.add('line-selected');
      selectedRows.push({ row, lineNum });
    }
  });

  if (selectedRows.length > 0) {
    selectedRows[0].row.classList.add('selection-start');
    selectedRows[selectedRows.length - 1].row.classList.add('selection-end');
  }
}

/**
 * Handle mousedown on diff line
 */
export function handleLineMouseDown(
  e: MouseEvent,
  state: SelectionState
): SelectionState {
  const target = e.target as HTMLElement;
  const row = target.closest('.diff-line') as HTMLElement | null;

  if (!row) return state;
  if (target.closest('.line-comment-btn') || target.closest('.inline-comment-form')) {
    return state;
  }

  // If a comment form is open with text, don't start a new selection
  const existingForm = document.querySelector('.comment-form-row');
  if (existingForm) {
    const textarea = existingForm.querySelector('textarea') as HTMLTextAreaElement | null;
    if (textarea && textarea.value.trim()) {
      return state;
    }
  }

  // Don't allow comments on deletion lines
  if (row.classList.contains('deletion')) return state;

  const lineNum = row.dataset.line;
  if (!lineNum) return state;

  const parsedLine = parseInt(lineNum);
  clearLineSelection();
  row.classList.add('line-selected', 'selection-start', 'selection-end');

  return {
    startLine: parsedLine,
    endLine: parsedLine,
    startRow: row,
    endRow: row,
    isSelecting: true,
  };
}

/**
 * Handle mousemove during selection
 */
export function handleLineMouseMove(
  e: MouseEvent,
  state: SelectionState
): SelectionState {
  if (!state.isSelecting) return state;

  const target = e.target as HTMLElement;
  const row = target.closest('.diff-line') as HTMLElement | null;
  if (!row) return state;

  const lineNum = row.dataset.line;
  if (!lineNum) return state;

  const parsedLine = parseInt(lineNum);
  const newState = {
    ...state,
    endLine: parsedLine,
    endRow: row,
  };

  updateLineSelection(state.startLine, parsedLine);
  return newState;
}

/**
 * Handle mouseup to complete selection
 */
export function handleLineMouseUp(
  e: MouseEvent,
  state: SelectionState
): { state: SelectionState; range: SelectionRange | null; element: HTMLElement | null } {
  if (!state.isSelecting) {
    return { state, range: null, element: null };
  }

  const newState = {
    ...state,
    isSelecting: false,
    startRow: null,
    endRow: null,
  };

  if (state.startLine === null || state.endLine === null) {
    return { state: newState, range: null, element: null };
  }

  const startLine = Math.min(state.startLine, state.endLine);
  const endLine = Math.max(state.startLine, state.endLine);
  const target = e.target as HTMLElement;

  // Only trigger if multi-line or clicked on content
  if (startLine !== endLine || target.closest('.diff-line-content')) {
    const lastSelectedRow = document.querySelector('.diff-line.selection-end') as HTMLElement | null;
    return {
      state: newState,
      range: { startLine, endLine },
      element: lastSelectedRow,
    };
  }

  return { state: newState, range: null, element: null };
}

/**
 * Setup line selection handlers on viewer
 */
export function setupLineSelectionHandlers(
  viewerId: string,
  handlers: LineSelectionHandlers,
  getState: () => SelectionState,
  setState: (state: SelectionState) => void
): void {
  const viewer = document.getElementById(viewerId);
  if (!viewer) return;

  // Handle comment button click
  viewer.onclick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('.line-comment-btn') as HTMLElement | null;
    if (btn) {
      const lineNum = parseInt(btn.dataset.line || '0');
      const lineElement = btn.closest('tr') as HTMLElement;
      handlers.onCommentButtonClick(lineNum, lineElement);
    }
  };

  viewer.onmousedown = (e: MouseEvent) => {
    const newState = handleLineMouseDown(e, getState());
    setState(newState);
  };

  viewer.onmousemove = (e: MouseEvent) => {
    const newState = handleLineMouseMove(e, getState());
    setState(newState);
  };

  document.onmouseup = (e: MouseEvent) => {
    const { state, range, element } = handleLineMouseUp(e, getState());
    setState(state);
    if (range && element) {
      handlers.onSelectionComplete(range, element);
    }
  };
}
