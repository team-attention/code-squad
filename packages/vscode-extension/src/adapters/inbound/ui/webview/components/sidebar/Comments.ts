/**
 * Comments Component
 *
 * Sidebar comments list with edit, delete, and navigation.
 */

import { escapeHtml } from '../../utils/dom';

export interface Comment {
  id: string;
  file: string;
  line: number;
  endLine?: number;
  text: string;
  isSubmitted?: boolean;
}

export interface CommentHandlers {
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (id: string) => void;
  onSaveScrollPosition: () => void;
}

/**
 * Render comments list into container
 */
export function renderComments(comments: Comment[]): void {
  const list = document.getElementById('comments-list');
  if (!list) return;

  if (!comments || comments.length === 0) {
    list.innerHTML = '<div class="empty-text">No comments yet</div>';
    return;
  }

  // Build color map for all comments
  const commentColorMap = new Map<string, number>();
  comments.forEach((comment, idx) => {
    commentColorMap.set(comment.id, idx % 6);
  });

  // Separate pending and submitted
  const pending = comments.filter((c) => !c.isSubmitted);
  const submitted = comments.filter((c) => c.isSubmitted);

  let html = '';

  // Pending comments with edit/delete (most recent first)
  const sortedPending = [...pending].reverse();
  sortedPending.forEach((comment) => {
    const lineDisplay = comment.endLine
      ? `${comment.line}-${comment.endLine}`
      : comment.line;
    const colorIndex = commentColorMap.get(comment.id);

    html += `
      <div class="comment-item color-${colorIndex}" data-id="${comment.id}">
        <div class="comment-header">
          <span class="comment-location" onclick="navigateToComment('${comment.id}')" title="${comment.file}:${lineDisplay}">
            📝 ${comment.file}:${lineDisplay}
          </span>
          <div class="comment-actions">
            <button class="btn-icon" onclick="startEditComment('${comment.id}')" title="Edit">✎</button>
            <button class="btn-icon btn-danger" onclick="deleteComment('${comment.id}')" title="Delete">🗑</button>
          </div>
        </div>
        <div class="comment-text" id="comment-text-${comment.id}">${escapeHtml(comment.text)}</div>
        <div class="comment-edit-form" id="comment-edit-${comment.id}" style="display: none;">
          <textarea class="comment-textarea">${escapeHtml(comment.text)}</textarea>
          <div class="comment-form-actions">
            <button class="btn-secondary" onclick="cancelEditComment('${comment.id}')">Cancel</button>
            <button onclick="saveEditComment('${comment.id}')">Save</button>
          </div>
        </div>
      </div>
    `;
  });

  // Submitted history section (collapsed by default)
  if (submitted.length > 0) {
    html += `
      <div class="submitted-section">
        <div class="submitted-header" onclick="toggleSubmittedHistory()">
          <span class="submitted-toggle" id="submitted-toggle">▶</span>
          <span>Submitted (${submitted.length})</span>
        </div>
        <div class="submitted-list" id="submitted-list" style="display: none;">
    `;
    const sortedSubmitted = [...submitted].reverse();
    sortedSubmitted.forEach((comment) => {
      const lineDisplay = comment.endLine
        ? `${comment.line}-${comment.endLine}`
        : comment.line;
      html += `
        <div class="comment-item submitted" data-id="${comment.id}">
          <div class="comment-header">
            <span class="comment-location">✓ ${comment.file}:${lineDisplay}</span>
            <span class="submitted-badge">submitted</span>
          </div>
          <div class="comment-text">${escapeHtml(comment.text)}</div>
        </div>
      `;
    });
    html += `
        </div>
      </div>
    `;
  }

  list.innerHTML = html;
}

/**
 * Setup keyboard handler for comment textarea
 * Enter to save, Cmd/Ctrl+Enter for newline
 */
function setupCommentTextareaKeyboard(
  textarea: HTMLTextAreaElement,
  onSave: () => void
): void {
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
        // Enter (without modifiers): save
        e.preventDefault();
        onSave();
      }
    }
  });
}

/**
 * Start editing a comment
 */
export function startEditComment(id: string, handlers?: CommentHandlers): void {
  const textEl = document.getElementById('comment-text-' + id);
  const editEl = document.getElementById('comment-edit-' + id);
  if (textEl) textEl.style.display = 'none';
  if (editEl) {
    editEl.style.display = 'block';
    const textarea = editEl.querySelector('textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.focus();
      // Setup keyboard handler if handlers provided and not already set
      if (handlers && !textarea.dataset.keyboardSetup) {
        textarea.dataset.keyboardSetup = 'true';
        setupCommentTextareaKeyboard(textarea, () => {
          saveEditComment(id, handlers);
        });
      }
    }
  }
}

/**
 * Cancel editing a comment
 */
export function cancelEditComment(id: string): void {
  const textEl = document.getElementById('comment-text-' + id);
  const editEl = document.getElementById('comment-edit-' + id);
  if (textEl) textEl.style.display = 'block';
  if (editEl) editEl.style.display = 'none';
}

/**
 * Save edited comment
 */
export function saveEditComment(
  id: string,
  handlers: CommentHandlers
): void {
  const editEl = document.getElementById('comment-edit-' + id);
  if (!editEl) return;

  const textarea = editEl.querySelector('textarea');
  if (!textarea) return;

  const text = textarea.value.trim();
  if (text) {
    handlers.onSaveScrollPosition();
    handlers.onEdit(id, text);
  }
  cancelEditComment(id);
}

/**
 * Delete a comment
 */
export function deleteComment(id: string, handlers: CommentHandlers): void {
  handlers.onSaveScrollPosition();
  handlers.onDelete(id);
}

/**
 * Navigate to a comment in the diff
 */
export function navigateToComment(id: string, handlers: CommentHandlers): void {
  handlers.onNavigate(id);
}

/**
 * Toggle submitted history visibility
 */
export function toggleSubmittedHistory(): void {
  const list = document.getElementById('submitted-list');
  const toggle = document.getElementById('submitted-toggle');
  if (!list || !toggle) return;

  if (list.style.display === 'none') {
    list.style.display = 'block';
    toggle.textContent = '▼';
  } else {
    list.style.display = 'none';
    toggle.textContent = '▶';
  }
}

/**
 * Register comment handlers on window for onclick attributes
 */
export function registerCommentHandlers(handlers: CommentHandlers): void {
  const win = window as unknown as Record<string, unknown>;
  win.startEditComment = (id: string) => startEditComment(id, handlers);
  win.cancelEditComment = cancelEditComment;
  win.saveEditComment = (id: string) => saveEditComment(id, handlers);
  win.deleteComment = (id: string) => deleteComment(id, handlers);
  win.navigateToComment = (id: string) => navigateToComment(id, handlers);
  win.toggleSubmittedHistory = toggleSubmittedHistory;
}
