# Task 5: Implement Chunk Collapse UI

**Requirement**: R2.1, R2.2
**Layer**: Adapters (Inbound/UI), Application (State)
**Dependencies**: Task 1, Task 3, Task 4

## Goal

Add collapse/expand functionality to diff chunks with scope name display when collapsed.

## Design Decisions

- **LSP Strategy**: Pre-fetch scopes on diff load (per user preference)
- **State Storage**: Session only (resets when panel closes)
- **Default State**: All chunks expanded

## Files to Modify

| File | Changes |
|------|---------|
| `src/application/ports/outbound/PanelState.ts` | Add collapse state types |
| `src/adapters/inbound/ui/SidecarPanelAdapter.ts` | Implement collapse UI |

## Implementation Steps

### Step 1: Extend PanelState Types

```typescript
// src/application/ports/outbound/PanelState.ts

import { ScopeInfo } from './ISymbolPort';

/**
 * Extended chunk info for UI rendering
 */
export interface ChunkDisplayInfo {
    index: number;
    isCollapsed: boolean;
    scopeLabel: string | null;  // e.g., "UserService.getUserById()" or "Lines 42-58"
}

/**
 * Diff display state (extends DiffResult for UI)
 */
export interface DiffDisplayState {
    file: string;
    chunks: DiffChunk[];
    stats: { additions: number; deletions: number };
    chunkStates: ChunkDisplayInfo[];  // Parallel array with collapse state
    scopes: ScopeInfo[];              // Pre-fetched scopes
}

// Update PanelState
export interface PanelState {
    sessionFiles: FileInfo[];
    uncommittedFiles: FileInfo[];
    showUncommitted: boolean;
    selectedFile: string | null;
    diff: DiffDisplayState | null;  // Changed from DiffResult
    comments: CommentInfo[];
    aiStatus: AIStatus;
}
```

### Step 2: Update IPanelStateManager

```typescript
// src/application/services/IPanelStateManager.ts

// Add new methods
export interface IPanelStateManager {
    // ... existing methods ...

    // Chunk collapse operations
    toggleChunkCollapse(chunkIndex: number): void;
    collapseAllChunks(): void;
    expandAllChunks(): void;
}
```

### Step 3: Update SidecarPanelAdapter HTML/CSS

```css
/* Add to <style> section */

.chunk-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--vscode-diffEditor-unchangedRegionBackground, rgba(56, 139, 253, 0.15));
    border-top: 1px solid var(--vscode-panel-border);
    border-bottom: 1px solid var(--vscode-panel-border);
    cursor: pointer;
    user-select: none;
}

.chunk-header:hover {
    background: var(--vscode-list-hoverBackground);
}

.chunk-toggle {
    font-size: 10px;
    transition: transform 0.2s;
}

.chunk-toggle.collapsed {
    transform: rotate(-90deg);
}

.chunk-scope {
    font-family: monospace;
    font-size: 12px;
    color: var(--vscode-textLink-foreground);
}

.chunk-stats {
    margin-left: auto;
    font-size: 11px;
    font-weight: 500;
}

.chunk-stats .added {
    color: var(--vscode-gitDecoration-addedResourceForeground, #3fb950);
}

.chunk-stats .removed {
    color: var(--vscode-gitDecoration-deletedResourceForeground, #f85149);
}

.chunk-lines {
    overflow: hidden;
    transition: max-height 0.2s ease-out;
}

.chunk-lines.collapsed {
    max-height: 0;
}

.chunk-collapse-all {
    display: flex;
    gap: 8px;
    padding: 4px 16px;
    border-bottom: 1px solid var(--vscode-panel-border);
    font-size: 11px;
}

.chunk-collapse-all button {
    width: auto;
    padding: 2px 8px;
    font-size: 10px;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
}
```

### Step 4: Update renderDiff Function

```javascript
// In <script> section

function renderDiff(diff, selectedFile) {
    // ... existing header/stats code ...

    if (!diff || !diff.chunks || diff.chunks.length === 0) {
        // ... existing empty state ...
        return;
    }

    // Add collapse all/expand all buttons
    let html = `
        <div class="chunk-collapse-all">
            <button onclick="collapseAllChunks()">Collapse All</button>
            <button onclick="expandAllChunks()">Expand All</button>
        </div>
        <table class="diff-table">
    `;

    html += renderChunksToHtml(diff.chunks, diff.chunkStates || []);
    html += '</table>';

    viewer.innerHTML = html;
    setupLineHoverHandlers(diff.file);
    setupChunkToggleHandlers();
}

function renderChunksToHtml(chunks, chunkStates) {
    let html = '';
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const state = chunkStates[i] || { isCollapsed: false, scopeLabel: null };
        const collapsedClass = state.isCollapsed ? 'collapsed' : '';
        const scopeLabel = state.scopeLabel || `Lines ${chunk.oldStart}-${chunk.oldStart + chunk.lines.length}`;

        // Chunk header (clickable)
        html += `
            <tr class="chunk-header-row" data-chunk-index="${i}">
                <td colspan="4" class="chunk-header">
                    <span class="chunk-toggle ${collapsedClass}">▼</span>
                    <span class="chunk-scope">${escapeHtml(scopeLabel)}</span>
                    <span class="chunk-stats">
                        <span class="added">+${chunk.stats?.additions || 0}</span>
                        <span class="removed">-${chunk.stats?.deletions || 0}</span>
                    </span>
                </td>
            </tr>
        `;

        // Chunk lines (collapsible)
        const linesClass = state.isCollapsed ? 'collapsed' : '';
        html += `<tbody class="chunk-lines ${linesClass}" data-chunk-index="${i}">`;

        for (const line of chunk.lines) {
            const lineClass = line.type;
            const prefix = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';
            const oldNum = line.oldLineNumber || '';
            const newNum = line.newLineNumber || '';
            const displayLineNum = newNum || oldNum || '';
            const showCommentBtn = line.type === 'addition' || line.type === 'deletion';

            html += `
                <tr class="diff-line ${lineClass}" data-line="${displayLineNum}">
                    <td class="comment-btn-cell">${showCommentBtn ? `<button class="line-comment-btn" data-line="${displayLineNum}">+</button>` : ''}</td>
                    <td class="diff-line-num">${oldNum}</td>
                    <td class="diff-line-num">${newNum}</td>
                    <td class="diff-line-content" data-prefix="${prefix}">${escapeHtml(line.content)}</td>
                </tr>
            `;
        }

        html += '</tbody>';
    }
    return html;
}

function setupChunkToggleHandlers() {
    document.querySelectorAll('.chunk-header-row').forEach(row => {
        row.onclick = () => {
            const index = parseInt(row.dataset.chunkIndex);
            vscode.postMessage({ type: 'toggleChunkCollapse', index });
        };
    });
}

window.collapseAllChunks = function() {
    vscode.postMessage({ type: 'collapseAllChunks' });
};

window.expandAllChunks = function() {
    vscode.postMessage({ type: 'expandAllChunks' });
};
```

### Step 5: Handle Messages in SidecarPanelAdapter

```typescript
// In onDidReceiveMessage handler
case 'toggleChunkCollapse':
    this.panelStateManager?.toggleChunkCollapse(message.index);
    break;
case 'collapseAllChunks':
    this.panelStateManager?.collapseAllChunks();
    break;
case 'expandAllChunks':
    this.panelStateManager?.expandAllChunks();
    break;
```

### Step 6: Pre-fetch Scopes on Diff Load

```typescript
// In handleSelectFile or showDiff
private async handleSelectFile(file: string): Promise<void> {
    if (!file || !this.generateDiffUseCase || !this.panelStateManager) return;

    const diffResult = await this.generateDiffUseCase.execute(file);

    if (diffResult === null) {
        this.panelStateManager.removeSessionFile(file);
    } else {
        // Pre-fetch scopes for all chunks
        const scopes = await this.prefetchScopes(file, diffResult);
        const displayState = this.createDiffDisplayState(diffResult, scopes);
        this.panelStateManager.showDiff(displayState);
    }
}

private async prefetchScopes(file: string, diff: DiffResult): Promise<ScopeInfo[]> {
    if (!this.symbolPort) return [];

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) return [];

    const absolutePath = path.join(workspaceRoot, file);

    // Get overall line range from all chunks
    let minLine = Infinity;
    let maxLine = 0;
    for (const chunk of diff.chunks) {
        minLine = Math.min(minLine, chunk.newStart);
        maxLine = Math.max(maxLine, chunk.newStart + chunk.lines.length);
    }

    return this.symbolPort.getScopesForRange(absolutePath, minLine, maxLine);
}

private createDiffDisplayState(diff: DiffResult, scopes: ScopeInfo[]): DiffDisplayState {
    const chunkStates: ChunkDisplayInfo[] = diff.chunks.map((chunk, index) => {
        // Find best matching scope for this chunk
        const scopeLabel = this.findScopeLabel(chunk, scopes);
        return {
            index,
            isCollapsed: false,
            scopeLabel
        };
    });

    return {
        ...diff,
        chunkStates,
        scopes
    };
}

private findScopeLabel(chunk: DiffChunk, scopes: ScopeInfo[]): string | null {
    const chunkStart = chunk.newStart;
    const chunkEnd = chunk.newStart + chunk.lines.length;

    // Find innermost scope that contains this chunk
    let bestScope: ScopeInfo | null = null;
    let bestSize = Infinity;

    for (const scope of scopes) {
        if (scope.startLine <= chunkStart && scope.endLine >= chunkEnd) {
            const size = scope.endLine - scope.startLine;
            if (size < bestSize) {
                bestSize = size;
                bestScope = scope;
            }
        }
    }

    if (bestScope) {
        const prefix = bestScope.containerName ? `${bestScope.containerName}.` : '';
        const suffix = bestScope.kind === 'method' || bestScope.kind === 'function' ? '()' : '';
        return `${prefix}${bestScope.name}${suffix}`;
    }

    return null;  // Will fallback to "Lines X-Y" in UI
}
```

## Validation

```bash
npm run compile
# Manual test: Click chunk header → should collapse/expand
# Manual test: Collapsed chunk should show scope name or line range
# Manual test: Collapse All/Expand All buttons work
```

## Architecture Compliance

- UI state managed in Application layer (PanelStateManager) ✓
- Message handling in Inbound Adapter (SidecarPanelAdapter) ✓
- LSP access through port interface (ISymbolPort) ✓
