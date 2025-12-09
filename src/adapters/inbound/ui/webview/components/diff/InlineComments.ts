/**
 * Inline Comments Component
 *
 * Comment forms and draft management within diff views.
 */

import { escapeHtml } from '../../utils/dom';
import { clearLineSelection } from './LineSelection';

export interface CommentDraft {
  file: string;
  startLine: number;
  endLine: number;
  text: string;
}

export interface InlineCommentHandlers {
  onSubmit: (file: string, startLine: number, endLine: number | undefined, text: string) => void;
  onDraftSave: (draft: CommentDraft) => void;
  onDraftClear: () => void;
  onSaveScrollPosition: () => void;
  onExpandSidebar: () => void;
  onEdit?: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
  getSignal: () => AbortSignal;
}

/**
 * Show inline comment form after line selection
 */
export function showInlineCommentForm(
  currentFile: string,
  selectedLineElement: HTMLElement | null,
  startLine: number,
  endLine: number | undefined,
  handlers: InlineCommentHandlers,
  existingText = ''
): void {
  const existingForm = document.querySelector('.comment-form-row');

  // Save current draft before removing existing form
  if (existingForm) {
    const existingTextarea = existingForm.querySelector('textarea');
    const text = existingTextarea ? (existingTextarea as HTMLTextAreaElement).value : '';
    if (text && !existingText) {
      existingText = text;
    }
    existingForm.remove();
  }

  if (!selectedLineElement) return;

  const actualEndLine = endLine || startLine;
  const isSingleLine = startLine === actualEndLine;
  const lineDisplay = isSingleLine ? `line ${startLine}` : `lines ${startLine}-${actualEndLine}`;

  const formRow = document.createElement('tr');
  formRow.className = 'comment-form-row';
  formRow.dataset.file = currentFile;
  formRow.dataset.start = String(startLine);
  formRow.dataset.end = String(actualEndLine);
  formRow.innerHTML = `
    <td colspan="3">
      <div class="inline-comment-form active">
        <div class="comment-form-header">Comment on ${lineDisplay}</div>
        <textarea class="comment-textarea" placeholder="Leave a comment...">${escapeHtml(existingText)}</textarea>
        <div class="comment-form-actions">
          <button class="btn-secondary" onclick="cancelCommentForm()">Cancel</button>
          <button onclick="submitInlineComment()">Add Comment</button>
        </div>
      </div>
    </td>
  `;
  selectedLineElement.after(formRow);

  const textarea = formRow.querySelector('textarea') as HTMLTextAreaElement;
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = textarea.value.length;

  // Save draft on input
  textarea.addEventListener(
    'input',
    () => {
      saveDraftComment(currentFile, startLine, actualEndLine, textarea.value, handlers);
    },
    { signal: handlers.getSignal() }
  );

  // Save initial draft if there's existing text
  if (existingText) {
    saveDraftComment(currentFile, startLine, actualEndLine, existingText, handlers);
  }
}

/**
 * Save draft comment to extension state
 */
export function saveDraftComment(
  file: string,
  startLine: number,
  endLine: number,
  text: string,
  handlers: InlineCommentHandlers
): void {
  if (text.trim()) {
    handlers.onDraftSave({
      file,
      startLine,
      endLine,
      text,
    });
  } else {
    handlers.onDraftClear();
  }
}

/**
 * Restore draft comment form from state
 */
export function restoreDraftCommentForm(
  draft: CommentDraft | null,
  handlers: InlineCommentHandlers
): void {
  if (!draft) return;

  const targetRow = document.querySelector(
    `.diff-line[data-line="${draft.endLine}"]`
  ) as HTMLElement | null;
  if (!targetRow) return;

  // Check if form already exists with same content
  const existingForm = document.querySelector('.comment-form-row');
  if (existingForm) {
    const existingText = (existingForm.querySelector('textarea') as HTMLTextAreaElement)?.value;
    if (existingText === draft.text) return;
  }

  showInlineCommentForm(
    draft.file,
    targetRow,
    draft.startLine,
    draft.endLine,
    handlers,
    draft.text
  );
}

/**
 * Cancel comment form
 */
export function cancelCommentForm(handlers: InlineCommentHandlers): void {
  clearLineSelection();
  const formRow = document.querySelector('.comment-form-row');
  if (formRow) formRow.remove();
  handlers.onDraftClear();
}

/**
 * Submit inline comment
 */
export function submitInlineComment(handlers: InlineCommentHandlers): void {
  const formRow = document.querySelector('.comment-form-row');
  if (!formRow) return;

  const textarea = formRow.querySelector('textarea') as HTMLTextAreaElement;
  const text = textarea.value;
  const startLine = parseInt(formRow.getAttribute('data-start') || '0');
  const endLine = parseInt(formRow.getAttribute('data-end') || '0');
  const currentFile = formRow.getAttribute('data-file') || '';

  if (text && currentFile) {
    handlers.onSaveScrollPosition();
    handlers.onSubmit(
      currentFile,
      startLine,
      startLine !== endLine ? endLine : undefined,
      text
    );
    clearLineSelection();
    formRow.remove();
    handlers.onExpandSidebar();
    handlers.onDraftClear();
  }
}

/**
 * Toggle inline comment visibility
 */
export function toggleInlineComment(elementOrLineNum: HTMLElement | number): void {
  let endLines: number[] = [];

  if (typeof elementOrLineNum === 'object' && elementOrLineNum.dataset) {
    const endLinesAttr = elementOrLineNum.dataset.endLines;
    if (endLinesAttr) {
      endLines = endLinesAttr.split(',').map(Number);
    }
  } else {
    endLines = [elementOrLineNum as number];
  }

  endLines.forEach((lineNum) => {
    const commentRow = document.querySelector(
      `.inline-comment-row[data-line="${lineNum}"]`
    );
    if (!commentRow) return;

    if (commentRow.classList.contains('collapsed')) {
      commentRow.classList.remove('collapsed');
    } else {
      commentRow.classList.add('collapsed');
    }
  });
}

/**
 * Start editing inline comment
 */
export function startInlineEdit(commentId: string): void {
  const bodyEl = document.getElementById('inline-body-' + commentId);
  const editEl = document.getElementById('inline-edit-' + commentId);
  if (bodyEl) bodyEl.style.display = 'none';
  if (editEl) {
    editEl.style.display = 'block';
    const textarea = editEl.querySelector('textarea');
    if (textarea) textarea.focus();
  }
}

/**
 * Cancel inline edit
 */
export function cancelInlineEdit(commentId: string): void {
  const bodyEl = document.getElementById('inline-body-' + commentId);
  const editEl = document.getElementById('inline-edit-' + commentId);
  if (bodyEl) bodyEl.style.display = 'block';
  if (editEl) editEl.style.display = 'none';
}

/**
 * Save inline edit
 */
export function saveInlineEdit(
  commentId: string,
  onEdit: (id: string, text: string) => void,
  onSaveScrollPosition: () => void
): void {
  const editEl = document.getElementById('inline-edit-' + commentId);
  if (!editEl) return;

  const textarea = editEl.querySelector('textarea');
  if (!textarea) return;

  const text = textarea.value.trim();
  if (text) {
    onSaveScrollPosition();
    onEdit(commentId, text);
  }
  cancelInlineEdit(commentId);
}

/**
 * Register inline comment handlers on window
 */
export function registerInlineCommentHandlers(handlers: InlineCommentHandlers): void {
  const win = window as unknown as Record<string, unknown>;
  win.cancelCommentForm = () => cancelCommentForm(handlers);
  win.submitInlineComment = () => submitInlineComment(handlers);
  win.toggleInlineComment = toggleInlineComment;
  win.startInlineEdit = startInlineEdit;
  win.cancelInlineEdit = cancelInlineEdit;
  win.saveInlineEdit = (commentId: string) => {
    if (handlers.onEdit) {
      saveInlineEdit(commentId, handlers.onEdit, handlers.onSaveScrollPosition);
    }
  };
  win.deleteComment = (commentId: string) => {
    if (handlers.onDelete) {
      handlers.onDelete(commentId);
    }
  };
}
