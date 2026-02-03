/**
 * Scoped Diff Component
 *
 * Renders diff organized by code scopes (classes, functions, etc.)
 */

import { escapeHtml } from '../../utils/dom';
import type { InlineComment } from './ChunkRenderer';

export interface ScopeDiffLine {
  type: 'addition' | 'deletion' | 'context';
  content: string;
  lineNumber: number;
}

export interface ScopeStats {
  additions: number;
  deletions: number;
}

export interface ScopeNode {
  scopeId: string;
  scopeName: string;
  scopeKind: string;
  depth: number;
  isCollapsed?: boolean;
  hasChanges?: boolean;
  stats: ScopeStats;
  lines?: ScopeDiffLine[];
  children?: ScopeNode[];
}

export interface ScopedDiffData {
  file: string;
  hasScopeData: boolean;
  stats: ScopeStats;
  scopes: ScopeNode[];
  orphanLines?: ScopeDiffLine[];
}

export const SCOPE_ICONS: Record<string, string> = {
  class: '📄',
  method: '🔧',
  function: '📌',
  constructor: '🏗️',
  interface: '📐',
  enum: '📊',
  module: '📦',
  namespace: '🗂️',
};

/**
 * Build comment lookup maps
 */
function buildCommentMaps(
  comments: InlineComment[]
): Map<number, InlineComment[]> {
  const colorMap = new Map<string, number>();
  comments.forEach((comment, idx) => {
    colorMap.set(comment.id, idx % 6);
  });

  const byLine = new Map<number, InlineComment[]>();
  comments.forEach((comment) => {
    const startLine = comment.line;
    const endLine = comment.endLine || comment.line;
    const colorIndex = colorMap.get(comment.id) ?? 0;

    for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
      if (!byLine.has(lineNum)) {
        byLine.set(lineNum, []);
      }
      byLine.get(lineNum)!.push({ ...comment, colorIndex });
    }
  });

  return byLine;
}

/**
 * Collect all lines for batch highlighting
 */
export function collectScopeLines(
  scopes: ScopeNode[],
  result: Array<{ lineNumber: number; content: string }>
): void {
  for (const scope of scopes) {
    if (scope.lines) {
      for (const line of scope.lines) {
        result.push({ lineNumber: line.lineNumber, content: line.content });
      }
    }
    if (scope.children) {
      collectScopeLines(scope.children, result);
    }
  }
}

/**
 * Render scope controls (expand/collapse all)
 */
function renderScopeControls(): string {
  return `
    <div class="scope-controls">
      <button class="scope-control-btn" data-action="expand-all">
        Expand All
      </button>
      <button class="scope-control-btn" data-action="collapse-all">
        Collapse All
      </button>
    </div>
  `;
}

/**
 * Render range indicators for comments
 */
function renderRangeIndicators(lineNum: number, lineComments: InlineComment[]): string {
  let html = '';
  lineComments.forEach((c) => {
    const isStart = c.line === lineNum;
    const isEnd = (c.endLine || c.line) === lineNum;
    const isSingle = isStart && isEnd;
    const posClass = isSingle ? 'single' : isStart ? 'start' : isEnd ? 'end' : 'middle';
    const colorIndex = c.colorIndex ?? 0;
    const dotMarker = isEnd
      ? `<span class="end-dot color-${colorIndex}">●</span>`
      : '';
    html += `<span class="range-line range-${posClass} color-${colorIndex}" style="left: ${4 + colorIndex * 3}px">${dotMarker}</span>`;
  });
  return html;
}

/**
 * Render inline comment box
 */
function renderInlineCommentBox(comment: InlineComment, lineNum: number): string {
  const isPending = !comment.isSubmitted;
  const statusClass = isPending ? 'pending' : 'submitted';
  const colorIndex = comment.colorIndex ?? 0;

  return `
    <div class="inline-comment-box ${statusClass} color-${colorIndex}" data-comment-id="${comment.id}">
      <div class="inline-comment-header" onclick="toggleInlineComment(${lineNum})" style="cursor: pointer;">
        <span class="comment-author">Comment</span>
        ${
          isPending
            ? `
          <div class="inline-comment-actions" onclick="event.stopPropagation()">
            <button class="btn-icon" onclick="startInlineEdit('${comment.id}')" title="Edit">✎</button>
            <button class="btn-icon btn-danger" onclick="deleteComment('${comment.id}')" title="Delete">🗑</button>
          </div>
        `
            : `
          <span class="submitted-label">submitted</span>
        `
        }
      </div>
      <div class="inline-comment-body" id="inline-body-${comment.id}">
        ${escapeHtml(comment.text)}
      </div>
      <div class="inline-comment-edit" id="inline-edit-${comment.id}" style="display: none;">
        <textarea class="comment-textarea">${escapeHtml(comment.text)}</textarea>
        <div class="comment-form-actions">
          <button class="btn-secondary" onclick="cancelInlineEdit('${comment.id}')">Cancel</button>
          <button onclick="saveInlineEdit('${comment.id}')">Save</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render diff lines within a scope
 */
export function renderScopeDiffLines(
  lines: ScopeDiffLine[],
  comments: InlineComment[],
  highlightMap: Map<number, string>
): string {
  const commentsByLine = buildCommentMaps(comments);

  let html =
    '<table class="diff-table"><colgroup><col class="col-gutter"><col class="col-line-num"><col class="col-content"></colgroup>';

  for (const line of lines) {
    const lineClass = line.type;
    const prefix =
      line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';
    const lineNum = line.lineNumber;
    const isDeletion = line.type === 'deletion';

    const hasComments = !isDeletion && commentsByLine.has(lineNum);
    const lineComments = hasComments ? commentsByLine.get(lineNum)! : [];
    const primaryComments = lineComments.filter(
      (c) => (c.endLine || c.line) === lineNum
    );

    const rangeIndicators = hasComments
      ? renderRangeIndicators(lineNum, lineComments)
      : '';
    const markerClass = hasComments ? 'has-comment' : '';
    const gutterAttrs =
      primaryComments.length > 0
        ? ` data-end-lines="${lineNum}" onclick="toggleInlineComment(this)"`
        : '';

    const highlightedContent =
      highlightMap.get(lineNum) || escapeHtml(line.content);

    html += `
      <tr class="diff-line ${lineClass}" data-line="${lineNum}">
        <td class="diff-gutter ${markerClass}"${gutterAttrs}>
          ${rangeIndicators}
        </td>
        <td class="diff-line-num">${lineNum}</td>
        <td class="diff-line-content shiki" data-prefix="${prefix}">${highlightedContent}</td>
      </tr>
    `;

    if (primaryComments.length > 0) {
      html += `
        <tr class="inline-comment-row" data-line="${lineNum}">
          <td colspan="3">
            <div class="inline-comments">
              ${primaryComments.map((c) => renderInlineCommentBox(c, lineNum)).join('')}
            </div>
          </td>
        </tr>
      `;
    }
  }

  html += '</table>';
  return html;
}

/**
 * Render a scope node recursively
 */
export function renderScopeNode(
  scope: ScopeNode,
  comments: InlineComment[],
  highlightMap: Map<number, string>
): string {
  const collapseClass = scope.isCollapsed ? 'collapsed' : '';
  const changesClass = scope.hasChanges ? 'has-changes' : '';
  const collapsedChangedClass =
    scope.hasChanges && scope.isCollapsed ? 'collapsed-with-changes' : '';
  const icon = SCOPE_ICONS[scope.scopeKind] || '○';

  const statsHtml = scope.hasChanges
    ? `<span class="added">+${scope.stats.additions}</span> <span class="removed">-${scope.stats.deletions}</span>`
    : '<span class="no-changes">unchanged</span>';

  let html = `
    <div class="scope-node"
         data-scope-id="${escapeHtml(scope.scopeId)}"
         data-depth="${scope.depth}">
      <div class="scope-header ${changesClass} ${collapsedChangedClass}">
        <span class="scope-toggle ${collapseClass}">▼</span>
        <span class="scope-icon ${scope.scopeKind}">${icon}</span>
        <span class="scope-name">${escapeHtml(scope.scopeName)}</span>
        <span class="scope-kind">${scope.scopeKind}</span>
        <span class="scope-stats">${statsHtml}</span>
      </div>
      <div class="scope-content ${collapseClass}">
  `;

  const lines = scope.lines || [];
  const children = scope.children || [];

  if (children.length === 0) {
    if (lines.length > 0) {
      html += `<div class="scope-lines">${renderScopeDiffLines(lines, comments, highlightMap)}</div>`;
    }
  } else {
    const sortedChildren = [...children].sort((a, b) => {
      const aLine = parseInt(a.scopeId.split('-').pop() || '0');
      const bLine = parseInt(b.scopeId.split('-').pop() || '0');
      return aLine - bLine;
    });

    let currentLineIdx = 0;

    for (const child of sortedChildren) {
      const childStartLine = parseInt(child.scopeId.split('-').pop() || '0');

      const linesBeforeChild: ScopeDiffLine[] = [];
      while (
        currentLineIdx < lines.length &&
        lines[currentLineIdx].lineNumber < childStartLine
      ) {
        linesBeforeChild.push(lines[currentLineIdx]);
        currentLineIdx++;
      }

      if (linesBeforeChild.length > 0) {
        html += `<div class="scope-lines">${renderScopeDiffLines(linesBeforeChild, comments, highlightMap)}</div>`;
      }

      html += renderScopeNode(child, comments, highlightMap);
    }

    const remainingLines = lines.slice(currentLineIdx);
    if (remainingLines.length > 0) {
      html += `<div class="scope-lines">${renderScopeDiffLines(remainingLines, comments, highlightMap)}</div>`;
    }
  }

  html += '</div></div>';
  return html;
}

/**
 * Render complete scoped diff view
 */
export function renderScopedDiffContent(
  scopedDiff: ScopedDiffData,
  comments: InlineComment[],
  highlightMap: Map<number, string>
): string {
  if (!scopedDiff.hasScopeData) {
    return `
      <div class="scope-fallback-message">
        Scope view unavailable for this file type. Showing diff view.
      </div>
    `;
  }

  let html = renderScopeControls();
  const fileName = scopedDiff.file.split('/').pop() || scopedDiff.file;

  html += '<div class="scope-tree">';

  // Root file scope
  const fileHasChanges =
    scopedDiff.stats.additions > 0 || scopedDiff.stats.deletions > 0;
  const fileStatsHtml = fileHasChanges
    ? `<span class="added">+${scopedDiff.stats.additions}</span> <span class="removed">-${scopedDiff.stats.deletions}</span>`
    : '<span class="no-changes">unchanged</span>';

  html += `
    <div class="scope-node file-root" data-scope-id="file-root">
      <div class="scope-header ${fileHasChanges ? 'has-changes' : ''}">
        <span class="scope-toggle">▼</span>
        <span class="scope-icon">📄</span>
        <span class="scope-name">${escapeHtml(fileName)}</span>
        <span class="scope-kind">file</span>
        <span class="scope-stats">${fileStatsHtml}</span>
      </div>
      <div class="scope-content">
  `;

  const orphanLines = scopedDiff.orphanLines || [];
  const scopes = scopedDiff.scopes || [];

  if (scopes.length === 0) {
    if (orphanLines.length > 0) {
      html += `<div class="scope-lines">${renderScopeDiffLines(orphanLines, comments, highlightMap)}</div>`;
    }
  } else {
    const sortedScopes = [...scopes].sort((a, b) => {
      const aLine = parseInt(a.scopeId.split('-').pop() || '0');
      const bLine = parseInt(b.scopeId.split('-').pop() || '0');
      return aLine - bLine;
    });

    let currentLineIdx = 0;

    for (const scope of sortedScopes) {
      const scopeStartLine = parseInt(scope.scopeId.split('-').pop() || '0');

      const linesBeforeScope: ScopeDiffLine[] = [];
      while (
        currentLineIdx < orphanLines.length &&
        orphanLines[currentLineIdx].lineNumber < scopeStartLine
      ) {
        linesBeforeScope.push(orphanLines[currentLineIdx]);
        currentLineIdx++;
      }

      if (linesBeforeScope.length > 0) {
        html += `<div class="scope-lines">${renderScopeDiffLines(linesBeforeScope, comments, highlightMap)}</div>`;
      }

      html += renderScopeNode(scope, comments, highlightMap);
    }

    const remainingLines = orphanLines.slice(currentLineIdx);
    if (remainingLines.length > 0) {
      html += `<div class="scope-lines">${renderScopeDiffLines(remainingLines, comments, highlightMap)}</div>`;
    }
  }

  html += '</div></div>'; // Close file root
  html += '</div>'; // Close scope-tree

  return html;
}

/**
 * Setup scope collapse/expand handlers
 */
export function setupScopeHandlers(
  onToggle: (scopeId: string) => void,
  onExpandAll: () => void,
  onCollapseAll: () => void,
  signal: AbortSignal
): void {
  document.querySelectorAll('.scope-header').forEach((header) => {
    header.addEventListener(
      'click',
      (e) => {
        e.stopPropagation();
        const node = (header as HTMLElement).closest('.scope-node');
        const scopeId = node?.getAttribute('data-scope-id');
        if (scopeId) {
          onToggle(scopeId);
        }
      },
      { signal }
    );
  });

  document.querySelectorAll('.scope-control-btn').forEach((btn) => {
    btn.addEventListener(
      'click',
      () => {
        const action = (btn as HTMLElement).dataset.action;
        if (action === 'expand-all') {
          onExpandAll();
        } else if (action === 'collapse-all') {
          onCollapseAll();
        }
      },
      { signal }
    );
  });
}

/**
 * Scroll to line in scoped diff
 */
export function scrollToLineInScopedDiff(
  line: number,
  onExpandScope: (line: number) => void
): void {
  onExpandScope(line);

  setTimeout(() => {
    const lineEl = document.querySelector(`.diff-line[data-line="${line}"]`);
    if (lineEl) {
      lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      lineEl.classList.add('highlight-target');
      setTimeout(() => lineEl.classList.remove('highlight-target'), 2000);
    }
  }, 150);
}
