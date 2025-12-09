/**
 * File List Component
 *
 * Renders file list in list or tree view mode with search filtering.
 */

import { escapeHtml } from '../../utils/dom';

export interface FileItem {
  path: string;
  name: string;
  status: 'added' | 'modified' | 'deleted';
  isUncommitted?: boolean;
  matchType?: 'path' | 'content';
}

export interface DiffData {
  file: string;
  chunks: Array<{
    lines: Array<{
      type: string;
      content: string;
    }>;
  }>;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  status?: 'added' | 'modified' | 'deleted';
  isUncommitted?: boolean;
  children?: TreeNode[];
  isExpanded?: boolean;
}

export interface FileListProps {
  sessionFiles: FileItem[];
  uncommittedFiles: FileItem[];
  selectedFile: string | null;
  isTreeView: boolean;
  searchQuery: string;
  showUncommitted: boolean;
  collapsedFolders: Set<string>;
  diff?: DiffData;
}

export interface FileListHandlers {
  onFileSelect: (filePath: string) => void;
  onFolderToggle: (folderPath: string, isCollapsed: boolean) => void;
}

/**
 * Render file list (list or tree view)
 */
export function renderFileList(
  props: FileListProps,
  handlers: FileListHandlers
): void {
  const {
    sessionFiles,
    uncommittedFiles,
    selectedFile,
    isTreeView,
    searchQuery,
    showUncommitted,
    collapsedFolders,
    diff,
  } = props;

  const list = document.getElementById('files-list');
  const toggleRow = document.getElementById('toggle-row');
  const toggleSwitch = document.getElementById('uncommitted-toggle');
  const countBadge = document.getElementById('uncommitted-count');
  const searchResults = document.getElementById('search-results');
  const viewModeToggle = document.getElementById('view-mode-toggle');

  if (!list) return;

  // Handle uncommitted toggle row
  if (toggleRow && toggleSwitch && countBadge) {
    if (uncommittedFiles && uncommittedFiles.length > 0) {
      toggleRow.style.display = 'flex';
      countBadge.textContent = String(uncommittedFiles.length);
      toggleSwitch.classList.toggle('checked', showUncommitted);
      toggleSwitch.textContent = showUncommitted ? '✓' : '';
    } else {
      toggleRow.style.display = 'none';
    }
  }

  // Build combined file list
  const allFiles: FileItem[] = [...(sessionFiles || [])];
  if (showUncommitted && uncommittedFiles) {
    allFiles.push(
      ...uncommittedFiles.map((f) => ({ ...f, isUncommitted: true }))
    );
  }

  // Apply search filter
  let filteredFiles = allFiles;
  const searchActive = searchQuery && searchQuery.trim().length > 0;

  if (searchActive) {
    const query = searchQuery.toLowerCase();
    filteredFiles = allFiles.filter((file) => {
      const pathMatch = file.path.toLowerCase().includes(query);
      if (pathMatch) {
        file.matchType = 'path';
        return true;
      }

      // Check diff content for matches
      if (diff && diff.file === file.path) {
        for (const chunk of diff.chunks) {
          for (const line of chunk.lines) {
            if (
              line.type === 'addition' &&
              line.content.toLowerCase().includes(query)
            ) {
              file.matchType = 'content';
              return true;
            }
          }
        }
      }

      return false;
    });

    if (searchResults) {
      searchResults.style.display = 'block';
      searchResults.textContent = `${filteredFiles.length} result${filteredFiles.length !== 1 ? 's' : ''}`;
    }
  } else {
    if (searchResults) {
      searchResults.style.display = 'none';
    }
  }

  // Handle empty state
  if (filteredFiles.length === 0) {
    list.innerHTML = searchActive
      ? '<div class="empty-text">No matching files</div>'
      : '<div class="empty-text">Waiting for changes...</div>';
    return;
  }

  // Update view mode button
  if (viewModeToggle) {
    viewModeToggle.textContent = isTreeView ? 'List' : 'Tree';
  }

  // Render content
  let html = '';
  if (isTreeView) {
    const tree = buildFileTree(filteredFiles, collapsedFolders);
    html += '<div class="file-tree">';
    html += renderTreeNode(tree, selectedFile, 0);
    html += '</div>';
  } else {
    html += filteredFiles
      .map((file) => {
        const isSelected = file.path === selectedFile;
        const { badgeText, badgeClass } = getStatusBadge(file.status);
        const uncommittedClass = file.isUncommitted ? 'uncommitted' : '';
        const contentMatchClass =
          file.matchType === 'content' ? 'content-match' : '';

        return `
        <div class="file-item ${isSelected ? 'selected' : ''} ${uncommittedClass} ${contentMatchClass}" data-file="${file.path}">
          <span class="file-icon">📄</span>
          <span class="file-name" title="${file.path}">${file.name}</span>
          <span class="file-badge ${badgeClass}">${badgeText}</span>
        </div>
      `;
      })
      .join('');
  }

  list.innerHTML = html;

  // Setup click handlers
  if (isTreeView) {
    setupTreeClickHandlers(handlers, collapsedFolders);
  } else {
    setupListClickHandlers(handlers);
  }
}

/**
 * Get status badge text and class
 */
function getStatusBadge(status: string): {
  badgeText: string;
  badgeClass: string;
} {
  if (status === 'added') {
    return { badgeText: 'A', badgeClass: 'added' };
  } else if (status === 'deleted') {
    return { badgeText: 'D', badgeClass: 'deleted' };
  }
  return { badgeText: 'M', badgeClass: 'modified' };
}

/**
 * Build tree structure from flat file list
 */
export function buildFileTree(
  files: FileItem[],
  collapsedFolders: Set<string>
): TreeNode {
  const root: TreeNode = {
    name: '',
    path: '',
    type: 'folder',
    children: [],
    isExpanded: true,
  };

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      if (isFile) {
        current.children = current.children || [];
        current.children.push({
          name: part,
          path: file.path,
          type: 'file',
          status: file.status,
          isUncommitted: file.isUncommitted,
        });
      } else {
        current.children = current.children || [];
        let folder = current.children.find(
          (c) => c.type === 'folder' && c.name === part
        );
        if (!folder) {
          folder = {
            name: part,
            path: currentPath,
            type: 'folder',
            children: [],
            isExpanded: !collapsedFolders.has(currentPath),
          };
          current.children.push(folder);
        }
        current = folder;
      }
    }
  }

  sortTreeNode(root);
  return root;
}

/**
 * Sort tree node (folders first, then alphabetically)
 */
function sortTreeNode(node: TreeNode): void {
  if (!node.children) return;

  node.children.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  for (const child of node.children) {
    if (child.type === 'folder') {
      sortTreeNode(child);
    }
  }
}

/**
 * Render tree node recursively
 */
function renderTreeNode(
  node: TreeNode,
  selectedFile: string | null,
  depth: number
): string {
  if (node.type === 'file') {
    const isSelected = node.path === selectedFile;
    const { badgeText, badgeClass } = getStatusBadge(node.status || 'modified');
    const uncommittedClass = node.isUncommitted ? 'uncommitted' : '';

    return `
      <div class="tree-file ${isSelected ? 'selected' : ''} ${uncommittedClass}"
           data-file="${node.path}">
        <span class="file-icon">📄</span>
        <span class="file-name">${escapeHtml(node.name)}</span>
        <span class="file-badge ${badgeClass}">${badgeText}</span>
      </div>
    `;
  }

  if (!node.children || node.children.length === 0) return '';

  // Root level: render children directly
  if (depth === 0) {
    return node.children
      .map((child) => renderTreeNode(child, selectedFile, depth + 1))
      .join('');
  }

  const fileCount = countFiles(node);
  const isExpanded = node.isExpanded !== false;
  const toggleClass = isExpanded ? '' : 'collapsed';
  const childrenClass = isExpanded ? '' : 'collapsed';

  return `
    <div class="tree-node" data-path="${node.path}">
      <div class="tree-folder" data-folder="${node.path}">
        <span class="tree-toggle ${toggleClass}">▼</span>
        <span class="file-icon">📁</span>
        <span class="tree-folder-name">${escapeHtml(node.name)}/</span>
        <span class="tree-folder-count">(${fileCount})</span>
      </div>
      <div class="tree-children ${childrenClass}">
        ${node.children.map((child) => renderTreeNode(child, selectedFile, depth + 1)).join('')}
      </div>
    </div>
  `;
}

/**
 * Count files in tree node
 */
function countFiles(node: TreeNode): number {
  if (node.type === 'file') return 1;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + countFiles(child), 0);
}

/**
 * Setup click handlers for tree view
 */
function setupTreeClickHandlers(
  handlers: FileListHandlers,
  collapsedFolders: Set<string>
): void {
  document.querySelectorAll('.tree-folder').forEach((folder) => {
    (folder as HTMLElement).onclick = (e) => {
      e.stopPropagation();
      const toggle = folder.querySelector('.tree-toggle');
      const children = folder.nextElementSibling;
      const folderPath = (folder as HTMLElement).dataset.folder || '';

      if (toggle) toggle.classList.toggle('collapsed');
      if (children) children.classList.toggle('collapsed');

      const isNowCollapsed = children?.classList.contains('collapsed') ?? false;
      handlers.onFolderToggle(folderPath, isNowCollapsed);
    };
  });

  document.querySelectorAll('.tree-file').forEach((file) => {
    (file as HTMLElement).onclick = () => {
      const filePath = (file as HTMLElement).dataset.file || '';
      handlers.onFileSelect(filePath);
    };
  });
}

/**
 * Setup click handlers for list view
 */
function setupListClickHandlers(handlers: FileListHandlers): void {
  document.querySelectorAll('.file-item').forEach((item) => {
    (item as HTMLElement).onclick = () => {
      const filePath = (item as HTMLElement).dataset.file || '';
      handlers.onFileSelect(filePath);
    };
  });
}
