# Task 7: Implement File Tree View

**Requirement**: R3.1
**Layer**: Application (State), Adapters (Inbound/UI)
**Dependencies**: Task 2 (Fix File Status Detection)

## Goal

Display changed files in a folder hierarchy instead of a flat list, with folder collapse/expand support.

## Design

### Current (Flat List)
```
📄 src/components/Button.tsx   [M]
📄 src/utils/format.ts         [M]
📄 src/index.ts                [A]
```

### Target (Tree View)
```
📁 src/ (3 files)
  📁 components/
    📄 Button.tsx   [M]
  📁 utils/
    📄 format.ts    [M]
  📄 index.ts       [A]
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/application/ports/outbound/PanelState.ts` | Add tree state types |
| `src/adapters/inbound/ui/SidecarPanelAdapter.ts` | Implement tree rendering |

## Implementation Steps

### Step 1: Define Tree Types

```typescript
// src/application/ports/outbound/PanelState.ts

/**
 * Tree node for file hierarchy display
 */
export interface FileTreeNode {
    name: string;              // Folder or file name
    path: string;              // Full relative path
    type: 'folder' | 'file';
    status?: 'added' | 'modified' | 'deleted';
    isUncommitted?: boolean;
    children?: FileTreeNode[];
    isExpanded?: boolean;      // For folders
}

// Update PanelState
export interface PanelState {
    // ... existing fields ...
    fileTree: FileTreeNode | null;  // Root of tree
    isTreeView: boolean;            // Toggle between flat/tree view
}
```

### Step 2: Add Tree Building Utility

```javascript
// In <script> section of SidecarPanelAdapter

/**
 * Build file tree from flat file list
 */
function buildFileTree(files) {
    const root = {
        name: '',
        path: '',
        type: 'folder',
        children: [],
        isExpanded: true
    };

    for (const file of files) {
        const parts = file.path.split('/');
        let current = root;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isFile = i === parts.length - 1;
            const currentPath = parts.slice(0, i + 1).join('/');

            if (isFile) {
                current.children.push({
                    name: part,
                    path: file.path,
                    type: 'file',
                    status: file.status,
                    isUncommitted: file.isUncommitted
                });
            } else {
                let folder = current.children.find(
                    c => c.type === 'folder' && c.name === part
                );
                if (!folder) {
                    folder = {
                        name: part,
                        path: currentPath,
                        type: 'folder',
                        children: [],
                        isExpanded: true
                    };
                    current.children.push(folder);
                }
                current = folder;
            }
        }
    }

    // Sort: folders first, then files, alphabetically
    sortTreeNode(root);
    return root;
}

function sortTreeNode(node) {
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
```

### Step 3: Update CSS for Tree View

```css
/* Add to <style> section */

.file-tree {
    font-size: 12px;
}

.tree-node {
    user-select: none;
}

.tree-folder {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 0;
    cursor: pointer;
}

.tree-folder:hover {
    background: var(--vscode-list-hoverBackground);
    border-radius: 4px;
}

.tree-toggle {
    width: 16px;
    text-align: center;
    font-size: 10px;
    transition: transform 0.15s;
}

.tree-toggle.collapsed {
    transform: rotate(-90deg);
}

.tree-folder-name {
    color: var(--vscode-foreground);
}

.tree-folder-count {
    color: var(--vscode-descriptionForeground);
    font-size: 10px;
    margin-left: 4px;
}

.tree-children {
    margin-left: 16px;
    overflow: hidden;
}

.tree-children.collapsed {
    display: none;
}

.tree-file {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    margin: 2px 0;
    border-radius: 4px;
    cursor: pointer;
}

.tree-file:hover {
    background: var(--vscode-list-hoverBackground);
}

.tree-file.selected {
    background: var(--vscode-list-activeSelectionBackground);
    color: var(--vscode-list-activeSelectionForeground);
}

.view-toggle {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
    font-size: 11px;
}

.view-toggle button {
    width: auto;
    padding: 2px 8px;
    font-size: 10px;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
}

.view-toggle button.active {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
}
```

### Step 4: Update renderFileList Function

```javascript
function renderFileList(sessionFiles, uncommittedFiles, showUncommitted, selectedFile, isTreeView) {
    const list = document.getElementById('files-list');
    // ... existing toggle row code ...

    // Combine files
    const allFiles = [...(sessionFiles || [])];
    if (showUncommitted && uncommittedFiles) {
        allFiles.push(...uncommittedFiles.map(f => ({ ...f, isUncommitted: true })));
    }

    if (allFiles.length === 0) {
        list.innerHTML = '<div class="empty-text">Waiting for changes...</div>';
        return;
    }

    // View toggle buttons
    let html = `
        <div class="view-toggle">
            <button class="${!isTreeView ? 'active' : ''}" onclick="setViewMode('flat')">List</button>
            <button class="${isTreeView ? 'active' : ''}" onclick="setViewMode('tree')">Tree</button>
        </div>
    `;

    if (isTreeView) {
        const tree = buildFileTree(allFiles);
        html += '<div class="file-tree">';
        html += renderTreeNode(tree, selectedFile, 0);
        html += '</div>';
    } else {
        // Existing flat list rendering
        html += allFiles.map(file => {
            // ... existing flat list code ...
        }).join('');
    }

    list.innerHTML = html;

    // Add click handlers
    if (isTreeView) {
        setupTreeHandlers(selectedFile);
    } else {
        setupFlatListHandlers();
    }
}

function renderTreeNode(node, selectedFile, depth) {
    if (node.type === 'file') {
        const isSelected = node.path === selectedFile;
        let badgeClass = 'modified';
        let badgeText = 'M';
        if (node.status === 'added') {
            badgeClass = 'added';
            badgeText = 'A';
        } else if (node.status === 'deleted') {
            badgeClass = 'deleted';
            badgeText = 'D';
        }
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

    // Folder
    if (!node.children || node.children.length === 0) return '';

    // Skip root node rendering
    if (depth === 0) {
        return node.children.map(child => renderTreeNode(child, selectedFile, depth + 1)).join('');
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
                ${node.children.map(child => renderTreeNode(child, selectedFile, depth + 1)).join('')}
            </div>
        </div>
    `;
}

function countFiles(node) {
    if (node.type === 'file') return 1;
    if (!node.children) return 0;
    return node.children.reduce((sum, child) => sum + countFiles(child), 0);
}

function setupTreeHandlers() {
    // Folder toggle
    document.querySelectorAll('.tree-folder').forEach(folder => {
        folder.onclick = (e) => {
            e.stopPropagation();
            const toggle = folder.querySelector('.tree-toggle');
            const children = folder.nextElementSibling;
            toggle.classList.toggle('collapsed');
            children.classList.toggle('collapsed');
        };
    });

    // File select
    document.querySelectorAll('.tree-file').forEach(file => {
        file.onclick = () => {
            vscode.postMessage({ type: 'selectFile', file: file.dataset.file });
        };
    });
}

window.setViewMode = function(mode) {
    vscode.postMessage({ type: 'setViewMode', isTreeView: mode === 'tree' });
};
```

### Step 5: Handle View Mode Toggle

```typescript
// In SidecarPanelAdapter.ts onDidReceiveMessage handler
case 'setViewMode':
    this.panelStateManager?.setTreeView(message.isTreeView);
    break;

// In IPanelStateManager
export interface IPanelStateManager {
    // ... existing methods ...
    setTreeView(isTree: boolean): void;
}
```

## Validation

```bash
npm run compile
# Manual test: Click "Tree" button → files grouped by folder
# Manual test: Click folder → collapses/expands
# Manual test: Click file in tree → shows diff
# Manual test: Click "List" button → back to flat list
```

## Architecture Compliance

- Tree building is pure logic in webview (client-side) ✓
- State management in Application layer ✓
- UI rendering in Inbound Adapter ✓
