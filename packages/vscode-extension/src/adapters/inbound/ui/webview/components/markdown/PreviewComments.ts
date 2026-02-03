/**
 * Preview Comments Component
 *
 * Drag selection and comment functionality for markdown preview mode.
 */

export interface PreviewSelectionState {
  isSelecting: boolean;
  startBlock: HTMLElement | null;
  endBlock: HTMLElement | null;
}

export interface PreviewCommentHandlers {
  onSubmit: (file: string, startLine: number, endLine: number | undefined, text: string) => void;
  onEdit: (id: string, text: string) => void;
  onSaveScrollPosition: () => void;
  onExpandSidebar: () => void;
  getSignal: () => AbortSignal;
}

/**
 * Create initial selection state
 */
export function createPreviewSelectionState(): PreviewSelectionState {
  return {
    isSelecting: false,
    startBlock: null,
    endBlock: null,
  };
}

/**
 * Clear preview selection
 */
export function clearPreviewSelection(): void {
  document
    .querySelectorAll('.diff-block.preview-selected, .diff-block.preview-in-range')
    .forEach((b) => {
      b.classList.remove('preview-selected', 'preview-in-range');
    });
}

/**
 * Update preview selection highlighting
 */
function updatePreviewSelection(
  startBlock: HTMLElement | null,
  endBlock: HTMLElement | null
): void {
  if (!startBlock || !endBlock) return;

  const preview = document.querySelector('.markdown-preview');
  if (!preview) return;

  const selectableBlocks = Array.from(
    preview.querySelectorAll('.diff-addition, .diff-normal')
  );

  const startIdx = selectableBlocks.indexOf(startBlock);
  const endIdx = selectableBlocks.indexOf(endBlock);

  if (startIdx === -1 || endIdx === -1) return;

  const minIdx = Math.min(startIdx, endIdx);
  const maxIdx = Math.max(startIdx, endIdx);

  selectableBlocks.forEach((b) => b.classList.remove('preview-selected'));

  for (let i = minIdx; i <= maxIdx; i++) {
    selectableBlocks[i].classList.add('preview-selected');
  }
}

/**
 * Show preview comment form
 */
function showPreviewCommentForm(
  block: HTMLElement,
  startLine: number,
  endLine: number
): void {
  const lineDisplay =
    startLine === endLine ? `line ${startLine}` : `lines ${startLine}-${endLine}`;

  const form = document.createElement('div');
  form.className = 'preview-comment-form';
  form.innerHTML = `
    <div class="comment-form-header">Comment on ${lineDisplay}</div>
    <textarea placeholder="Leave a comment..."></textarea>
    <div class="comment-form-actions">
      <button class="btn-secondary" onclick="closePreviewCommentForm()">Cancel</button>
      <button onclick="submitPreviewComment(${startLine}, ${endLine})">Add Comment</button>
    </div>
  `;

  block.appendChild(form);
  const textarea = form.querySelector('textarea') as HTMLTextAreaElement | null;
  if (textarea) {
    textarea.focus();
    // Enter to submit, Cmd/Ctrl+Enter for newline
    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (e.metaKey || e.ctrlKey) {
          // Cmd/Ctrl+Enter: insert newline
          e.preventDefault();
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          textarea.value = textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        } else if (!e.shiftKey) {
          // Enter (without modifiers): submit
          e.preventDefault();
          const submitBtn = form.querySelector('button:not(.btn-secondary)') as HTMLButtonElement | null;
          if (submitBtn) submitBtn.click();
        }
      }
    });
  }
}

/**
 * Setup preview comment handlers
 */
export function setupPreviewCommentHandlers(
  file: string,
  handlers: PreviewCommentHandlers,
  getState: () => PreviewSelectionState,
  setState: (state: PreviewSelectionState) => void
): void {
  const preview = document.querySelector('.markdown-preview') as HTMLElement | null;
  if (!preview) return;

  preview.onmousedown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.preview-comment-form')) return;
    if (target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA') return;

    const block = target.closest('.diff-addition, .diff-normal') as HTMLElement | null;
    if (!block) return;

    clearPreviewSelection();
    const existingForm = document.querySelector('.preview-comment-form');
    if (existingForm) existingForm.remove();

    block.classList.add('preview-selected');
    setState({
      isSelecting: true,
      startBlock: block,
      endBlock: block,
    });
    e.preventDefault();
  };

  preview.onmousemove = (e: MouseEvent) => {
    const state = getState();
    if (!state.isSelecting || !state.startBlock) return;

    const target = e.target as HTMLElement;
    const block = target.closest('.diff-addition, .diff-normal') as HTMLElement | null;
    if (!block || block === state.endBlock) return;

    setState({ ...state, endBlock: block });
    updatePreviewSelection(state.startBlock, block);
  };

  document.addEventListener(
    'mouseup',
    () => {
      const state = getState();
      if (!state.isSelecting || !state.startBlock) {
        setState({ ...state, isSelecting: false });
        return;
      }

      setState({ ...state, isSelecting: false });

      const selectedBlocks = document.querySelectorAll('.diff-block.preview-selected');
      if (selectedBlocks.length === 0) return;

      let minLine = Infinity;
      let maxLine = -Infinity;

      selectedBlocks.forEach((block) => {
        const start = parseInt((block as HTMLElement).dataset.startLine || '0', 10);
        const end = parseInt((block as HTMLElement).dataset.endLine || String(start), 10);
        if (start < minLine) minLine = start;
        if (end > maxLine) maxLine = end;
      });

      const lastBlock = selectedBlocks[selectedBlocks.length - 1] as HTMLElement;
      showPreviewCommentForm(lastBlock, minLine, maxLine);
    },
    { signal: handlers.getSignal() }
  );

  // Register window functions
  registerPreviewCommentWindowFunctions(file, handlers);
}

/**
 * Register preview comment handlers on window
 */
function registerPreviewCommentWindowFunctions(
  file: string,
  handlers: PreviewCommentHandlers
): void {
  const win = window as unknown as Record<string, unknown>;

  win.closePreviewCommentForm = () => {
    const form = document.querySelector('.preview-comment-form');
    if (form) form.remove();
    clearPreviewSelection();
  };

  win.submitPreviewComment = (startLine: number, endLine: number) => {
    const form = document.querySelector('.preview-comment-form');
    if (!form) return;

    const textarea = form.querySelector('textarea') as HTMLTextAreaElement | null;
    const text = textarea?.value?.trim();
    if (!text) return;

    handlers.onSaveScrollPosition();
    handlers.onSubmit(file, startLine, startLine !== endLine ? endLine : undefined, text);
    form.remove();
    clearPreviewSelection();
    handlers.onExpandSidebar();
  };

  win.startPreviewCommentEdit = (commentId: string) => {
    const bodyEl = document.getElementById('preview-body-' + commentId);
    const editEl = document.getElementById('preview-edit-' + commentId);
    if (bodyEl) bodyEl.style.display = 'none';
    if (editEl) {
      editEl.style.display = 'block';
      const textarea = editEl.querySelector('textarea');
      if (textarea) textarea.focus();
    }
  };

  win.cancelPreviewCommentEdit = (commentId: string) => {
    const bodyEl = document.getElementById('preview-body-' + commentId);
    const editEl = document.getElementById('preview-edit-' + commentId);
    if (bodyEl) bodyEl.style.display = 'block';
    if (editEl) editEl.style.display = 'none';
  };

  win.savePreviewCommentEdit = (commentId: string) => {
    const editEl = document.getElementById('preview-edit-' + commentId);
    if (!editEl) return;

    const textarea = editEl.querySelector('textarea') as HTMLTextAreaElement | null;
    const text = textarea?.value?.trim();
    if (text) {
      handlers.onSaveScrollPosition();
      handlers.onEdit(commentId, text);
    }
    (win.cancelPreviewCommentEdit as (id: string) => void)(commentId);
  };
}
