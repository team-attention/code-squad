/**
 * Diff Viewer Component
 *
 * Main orchestrator for rendering diff views (unified, scope, preview).
 */

import type { DiffChunk, ChunkState, InlineComment } from './ChunkRenderer';
import type { DiffStats, ViewMode, DiffHeaderProps } from './DiffHeader';
import { renderStatsSection, renderPlaceholder } from './DiffHeader';

export interface DiffData {
  file: string;
  chunks: DiffChunk[];
  stats: DiffStats;
  chunkStates?: ChunkState[];
}

export interface DiffViewerProps {
  diff: DiffData | null;
  selectedFile: string | null;
  viewMode: ViewMode;
  comments: InlineComment[];
  hasScopedDiff: boolean;
  isMarkdown: boolean;
  aiActive: boolean;
}

export interface DiffViewerElements {
  header: HTMLElement;
  stats: HTMLElement;
  viewer: HTMLElement;
  toolbar: HTMLElement;
  collapseButton: HTMLElement;
}

/**
 * Get diff viewer elements
 */
export function getDiffViewerElements(): DiffViewerElements | null {
  const header = document.querySelector('.diff-header-title') as HTMLElement | null;
  const stats = document.getElementById('diff-stats');
  const viewer = document.getElementById('diff-viewer');
  const toolbar = document.getElementById('diff-toolbar');
  const collapseButton = document.getElementById('diff-collapse-all');

  if (!header || !stats || !viewer || !toolbar || !collapseButton) {
    return null;
  }

  return { header, stats, viewer, toolbar, collapseButton };
}

/**
 * Update diff header with file info
 */
export function updateDiffViewerHeader(
  elements: DiffViewerElements,
  props: DiffViewerProps,
  onOpenFile: (filePath: string) => void
): void {
  const { header, stats, toolbar, collapseButton } = elements;
  const { diff, viewMode, hasScopedDiff, isMarkdown, aiActive } = props;

  if (!diff || !diff.chunks || diff.chunks.length === 0) {
    toolbar.style.display = 'none';
    return;
  }

  toolbar.style.display = 'flex';

  header.textContent = diff.file;
  header.style.cursor = 'pointer';
  header.onclick = () => onOpenFile(diff.file);

  const headerProps: DiffHeaderProps = {
    filePath: diff.file,
    stats: diff.stats,
    viewMode,
    hasScopedDiff,
    isMarkdown,
    aiActive,
  };

  stats.innerHTML = renderStatsSection(headerProps);

  // Update collapse button text
  const chunkStates = diff.chunkStates || [];
  const allCollapsed =
    chunkStates.length > 0 && chunkStates.every((s) => s.isCollapsed);
  collapseButton.textContent = allCollapsed ? 'Expand' : 'Collapse';
}

/**
 * Render empty/placeholder state
 */
export function renderEmptyState(
  elements: DiffViewerElements,
  selectedFile: string | null
): void {
  const { header, stats, viewer, toolbar } = elements;

  header.textContent = selectedFile || 'Select a file to review';
  stats.innerHTML = '';
  toolbar.style.display = 'none';
  viewer.innerHTML = renderPlaceholder(selectedFile);
}

/**
 * Toggle diff view mode
 */
export function getNextViewMode(
  currentMode: ViewMode,
  isMarkdown: boolean,
  hasScopedDiff: boolean
): ViewMode {
  if (isMarkdown) {
    return currentMode === 'preview' ? 'diff' : 'preview';
  }
  if (hasScopedDiff) {
    return currentMode === 'scope' ? 'diff' : 'scope';
  }
  return 'diff';
}

/**
 * Register view mode toggle on window
 */
export function registerViewModeToggle(
  onToggle: () => void
): void {
  const win = window as unknown as Record<string, unknown>;
  win.toggleDiffViewMode = onToggle;
}

/**
 * Register feed toggle on window
 */
export function registerFeedToggle(
  onToggle: () => void
): void {
  const win = window as unknown as Record<string, unknown>;
  win.toggleFeed = onToggle;
}

/**
 * Render diff table wrapper
 */
export function renderDiffTableWrapper(tableContent: string): string {
  return `
    <table class="diff-table">
      <colgroup>
        <col class="col-gutter">
        <col class="col-line-num">
        <col class="col-content">
      </colgroup>
      ${tableContent}
    </table>
  `;
}
