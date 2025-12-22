/**
 * Chunk Renderer Component
 *
 * Renders diff chunks with syntax highlighting and inline comments.
 */

import { escapeHtml } from '../../utils/dom';

export interface DiffLine {
  type: 'addition' | 'deletion' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface ChunkStats {
  additions: number;
  deletions: number;
}

export interface DiffChunk {
  oldStart: number;
  newStart: number;
  lines: DiffLine[];
  stats?: ChunkStats;
}

export interface ChunkState {
  isCollapsed: boolean;
  scopeLabel?: string | null;
}

export interface InlineComment {
  id: string;
  line: number;
  endLine?: number;
  text: string;
  isSubmitted?: boolean;
  colorIndex?: number;
}

declare global {
  interface Window {
    CodeSquadHighlighter?: {
      highlightLines: (lines: string[], language: string) => Promise<string[]>;
      highlightFullFile: (fullContent: string, language: string) => Promise<Map<number, string>>;
      getLanguageFromPath: (path: string) => string;
    };
  }
}

/**
 * Build comment lookup maps
 */
function buildCommentMaps(
  comments: InlineComment[]
): {
  colorMap: Map<string, number>;
  byLine: Map<number, InlineComment[]>;
} {
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

  return { colorMap, byLine };
}

/**
 * Render range indicators for comments on a line
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
function renderInlineCommentBox(comment: InlineComment): string {
  const isPending = !comment.isSubmitted;
  const statusClass = isPending ? 'pending' : 'submitted';
  const colorIndex = comment.colorIndex ?? 0;
  const lineNum = comment.endLine || comment.line;

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
 * Render all diff chunks to HTML with syntax highlighting
 * @param chunks - Diff chunks to render
 * @param chunkStates - Collapse states for each chunk
 * @param comments - Inline comments
 * @param language - Programming language for syntax highlighting
 * @param highlightedLineMap - Optional pre-highlighted line map from full file.
 *   When provided, uses this for accurate syntax highlighting context
 *   (handles multi-line strings, block comments spanning hunks).
 *   Keys are 1-indexed line numbers.
 */
export async function renderChunksToHtml(
  chunks: DiffChunk[],
  chunkStates: ChunkState[],
  comments: InlineComment[] = [],
  language = 'plaintext',
  highlightedLineMap?: Map<number, string>
): Promise<string> {
  const { byLine: commentsByLine } = buildCommentMaps(comments);

  // If we have a pre-highlighted full file map, use it directly
  // Otherwise, fall back to highlighting just the chunk lines
  let highlightedContents: string[] | null = null;

  if (!highlightedLineMap) {
    // Collect all line contents for batch highlighting (legacy fallback)
    const allLineContents: string[] = [];
    for (const chunk of chunks) {
      for (const line of chunk.lines) {
        allLineContents.push(line.content);
      }
    }

    // Highlight all lines at once (async)
    highlightedContents = allLineContents.map(escapeHtml);
    if (window.CodeSquadHighlighter && language !== 'plaintext') {
      try {
        highlightedContents = await window.CodeSquadHighlighter.highlightLines(
          allLineContents,
          language
        );
      } catch (e) {
        console.warn('Syntax highlighting failed:', e);
      }
    }
  }

  let html = '';
  let lineIndex = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const state = chunkStates[i] || { isCollapsed: false, scopeLabel: null };

    // In diff mode, always use standard GitHub-style hunk headers (ignore scopeLabel)
    // scopeLabel is only used in the dedicated Scope View (renderScopedDiff)
    let chunkHeader: string;
    if (chunk.oldStart === 0) {
      chunkHeader = 'New file';
    } else {
      const oldCount = chunk.lines.filter(l => l.type !== 'addition').length;
      const newCount = chunk.lines.filter(l => l.type !== 'deletion').length;
      chunkHeader = `@@ -${chunk.oldStart},${oldCount} +${chunk.newStart},${newCount} @@`;
    }

    html += renderChunkHeader(chunkHeader, i, chunk.stats);

    const linesClass = state.isCollapsed ? 'collapsed' : '';
    html += `<tbody class="chunk-lines ${linesClass}" data-chunk-index="${i}">`;

    for (const line of chunk.lines) {
      const lineNum = line.newLineNumber || line.oldLineNumber || 0;
      const isDeletion = line.type === 'deletion';

      // Get highlighted content: prefer full-file map, fallback to batch highlighting
      let highlightedContent: string;
      if (highlightedLineMap && lineNum > 0) {
        // For additions/context, use newLineNumber from the full file map
        // For deletions, we don't have the line in the new file, so escape the content
        if (isDeletion) {
          highlightedContent = escapeHtml(line.content);
        } else {
          highlightedContent = highlightedLineMap.get(lineNum) || escapeHtml(line.content);
        }
      } else if (highlightedContents) {
        highlightedContent = highlightedContents[lineIndex] || escapeHtml(line.content);
      } else {
        highlightedContent = escapeHtml(line.content);
      }
      lineIndex++;

      const hasComments = !isDeletion && commentsByLine.has(lineNum);
      const lineComments = hasComments ? commentsByLine.get(lineNum)! : [];
      const primaryComments = lineComments.filter(
        (c) => (c.endLine || c.line) === lineNum
      );

      html += renderDiffLine(
        line,
        lineNum,
        highlightedContent,
        hasComments,
        lineComments,
        primaryComments
      );
    }

    html += '</tbody>';
  }

  return html;
}

/**
 * Render chunk header row
 */
function renderChunkHeader(
  scopeLabel: string,
  index: number,
  stats?: ChunkStats
): string {
  return `
    <tr class="chunk-header-row" data-chunk-index="${index}">
      <td colspan="3" class="chunk-header">
        <span class="chunk-toggle">▼</span>
        <span class="chunk-scope">${escapeHtml(scopeLabel)}</span>
        <span class="chunk-stats">
          <span class="added">+${stats?.additions || 0}</span>
          <span class="removed">-${stats?.deletions || 0}</span>
        </span>
      </td>
    </tr>
  `;
}

/**
 * Render single diff line row
 */
function renderDiffLine(
  line: DiffLine,
  lineNum: number,
  highlightedContent: string,
  hasComments: boolean,
  lineComments: InlineComment[],
  primaryComments: InlineComment[]
): string {
  const lineClass = line.type;
  const prefix =
    line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';
  const rangeIndicators = hasComments
    ? renderRangeIndicators(lineNum, lineComments)
    : '';
  const markerClass = hasComments ? 'has-comment' : '';
  const gutterAttrs =
    primaryComments.length > 0
      ? ` data-end-lines="${lineNum}" onclick="toggleInlineComment(this)"`
      : '';

  let html = `
    <tr class="diff-line ${lineClass}" data-line="${lineNum}">
      <td class="diff-gutter ${markerClass}"${gutterAttrs}>
        ${rangeIndicators}
      </td>
      <td class="diff-line-num">${lineNum}</td>
      <td class="diff-line-content shiki" data-prefix="${prefix}">${highlightedContent}</td>
    </tr>
  `;

  // Add inline comment row for comments that END on this line
  if (primaryComments.length > 0) {
    html += `
      <tr class="inline-comment-row" data-line="${lineNum}">
        <td colspan="3">
          <div class="inline-comments">
            ${primaryComments.map(renderInlineCommentBox).join('')}
          </div>
        </td>
      </tr>
    `;
  }

  return html;
}

/**
 * Setup chunk collapse/expand handlers
 */
export function setupChunkToggleHandlers(
  onToggle: (chunkIndex: number) => void
): void {
  document.querySelectorAll('.chunk-header-row').forEach((row) => {
    (row as HTMLElement).onclick = () => {
      const index = parseInt((row as HTMLElement).dataset.chunkIndex || '0');
      onToggle(index);
    };
  });
}
