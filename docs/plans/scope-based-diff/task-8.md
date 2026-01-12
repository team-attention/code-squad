# Task 8: Implement Scoped Diff Rendering in Webview

**Layer**: Adapter (UI/Webview)
**Dependencies**: Tasks 6, 7

## Goal

Implement the webview rendering logic for the scoped diff view, including expand/collapse interactions and integration with existing comment system.

## Files to Modify

| File | Action |
|------|--------|
| `src/adapters/inbound/ui/webview/script.ts` | MODIFY - Add rendering |
| `src/adapters/inbound/ui/webview/html.ts` | MODIFY - If needed |

## Test Scenarios (Manual)

### TS-8.1: Render scope tree
**Given**: ScopedDiffDisplayState with nested scopes
**When**: File is selected
**Then**: Renders hierarchical scope tree with proper nesting

### TS-8.2: Toggle scope collapse
**Given**: Rendered scope tree
**When**: User clicks scope header (unchanged scope)
**Then**: Scope content toggles visibility, message sent to extension

### TS-8.3: Cannot collapse changed scope
**Given**: Scope with hasChanges=true
**When**: User clicks scope header
**Then**: Nothing happens (scope stays expanded)

### TS-8.4: Expand All button
**Given**: Some scopes collapsed
**When**: User clicks "Expand All"
**Then**: All scopes expand

### TS-8.5: Collapse All button
**Given**: All scopes expanded
**When**: User clicks "Collapse All"
**Then**: Only unchanged scopes collapse

### TS-8.6: Navigate to line within scope
**Given**: Comment in collapsed scope
**When**: User clicks comment in sidebar
**Then**: Containing scope expands, scrolls to line

### TS-8.7: Add comment within scope
**Given**: Expanded scope with visible lines
**When**: User clicks add comment on a line
**Then**: Comment form appears, comment can be added

## Implementation

### script.ts additions

```typescript
// Scope icon map
const SCOPE_ICONS: Record<string, string> = {
    class: '\u{1F4C4}',      // page facing up
    method: '\u{1F527}',     // wrench
    function: '\u{1F4CC}',   // pushpin
    constructor: '\u{1F3D7}', // building construction
    interface: '\u{1F4D0}',  // triangular ruler
    enum: '\u{1F4CA}',       // bar chart
    module: '\u{1F4E6}',     // package
    namespace: '\u{1F5C2}',  // folder
};

function renderScopedDiff(
    scopedDiff: ScopedDiffDisplayState,
    selectedFile: string,
    comments: CommentDisplay[] = []
): void {
    const viewer = document.getElementById('diff-viewer');
    if (!viewer) return;

    if (!scopedDiff.hasScopeData) {
        // Show fallback message and render chunk-based
        viewer.innerHTML = `
            <div class="scope-fallback-message">
                Scope view unavailable for this file type. Showing chunk-based view.
            </div>
        `;
        // Render regular diff after message
        return;
    }

    let html = '';

    // Scope controls
    html += `
        <div class="scope-controls">
            <button class="scope-control-btn" data-action="expand-all">
                Expand All
            </button>
            <button class="scope-control-btn" data-action="collapse-all">
                Collapse All
            </button>
        </div>
    `;

    // Scope tree
    html += '<div class="scope-tree">';

    for (const scope of scopedDiff.scopes) {
        html += renderScopeNode(scope, comments);
    }

    // Orphan lines
    if (scopedDiff.orphanLines.length > 0) {
        html += `
            <div class="orphan-lines">
                <div class="orphan-lines-header">File-level code</div>
                <div class="scope-lines">
                    ${renderDiffLines(scopedDiff.orphanLines, comments)}
                </div>
            </div>
        `;
    }

    html += '</div>';
    viewer.innerHTML = html;

    setupScopeHandlers();
}

function renderScopeNode(
    scope: ScopedChunkDisplay,
    comments: CommentDisplay[]
): string {
    const collapseClass = scope.isCollapsed ? 'collapsed' : '';
    const changesClass = scope.hasChanges ? 'has-changes' : '';
    const noCollapseClass = scope.hasChanges ? 'no-collapse' : '';
    const icon = SCOPE_ICONS[scope.scopeKind] || '\u{25CB}';  // circle

    const statsHtml = scope.hasChanges
        ? `<span class="added">+${scope.stats.additions}</span>
           <span class="removed">-${scope.stats.deletions}</span>`
        : `<span class="no-changes">unchanged</span>`;

    let html = `
        <div class="scope-node"
             data-scope-id="${escapeHtml(scope.scopeId)}"
             data-depth="${scope.depth}">
            <div class="scope-header ${changesClass} ${noCollapseClass}">
                <span class="scope-toggle ${collapseClass}">▼</span>
                <span class="scope-icon ${scope.scopeKind}">${icon}</span>
                <span class="scope-name">${escapeHtml(scope.scopeName)}</span>
                <span class="scope-kind">${scope.scopeKind}</span>
                <span class="scope-stats">${statsHtml}</span>
            </div>
            <div class="scope-content ${collapseClass}">
    `;

    // Render diff lines for this scope
    if (scope.lines.length > 0) {
        html += `
            <div class="scope-lines">
                ${renderDiffLines(scope.lines, comments)}
            </div>
        `;
    }

    // Render children recursively
    for (const child of scope.children) {
        html += renderScopeNode(child, comments);
    }

    html += '</div></div>';
    return html;
}

function setupScopeHandlers(): void {
    // Scope header click handler
    document.querySelectorAll('.scope-header').forEach(header => {
        header.addEventListener('click', (e) => {
            e.stopPropagation();

            if (header.classList.contains('no-collapse')) {
                return;  // Cannot collapse scopes with changes
            }

            const node = header.closest('.scope-node') as HTMLElement;
            const scopeId = node?.dataset.scopeId;

            if (scopeId) {
                vscode.postMessage({
                    type: 'toggleScopeCollapse',
                    scopeId
                });
            }
        });
    });

    // Expand/Collapse all buttons
    document.querySelectorAll('.scope-control-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = (btn as HTMLElement).dataset.action;

            if (action === 'expand-all') {
                vscode.postMessage({ type: 'expandAllScopes' });
            } else if (action === 'collapse-all') {
                vscode.postMessage({ type: 'collapseAllScopes' });
            }
        });
    });
}

// Modify renderState to handle scoped diff
function renderState(state: PanelState): void {
    // ... existing file list rendering

    if (state.scopedDiff) {
        renderScopedDiff(
            state.scopedDiff,
            state.selectedFile || '',
            state.comments
        );
    } else if (state.diff) {
        renderDiff(
            state.diff,
            state.selectedFile || '',
            state.diffViewMode,
            state.comments
        );
    }
}

// Update scroll to line for scoped view
function scrollToLineInScopedDiff(line: number): void {
    // First, request scope expansion
    vscode.postMessage({
        type: 'expandScopeForLine',
        line
    });

    // Then scroll after a short delay for DOM update
    setTimeout(() => {
        const lineEl = document.querySelector(`[data-line="${line}"]`);
        if (lineEl) {
            lineEl.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // Highlight the line
            lineEl.classList.add('highlight');
            setTimeout(() => lineEl.classList.remove('highlight'), 2000);
        }
    }, 150);
}

// Modify existing comment navigation
function handleCommentNavigation(fileId: string, line: number): void {
    // ... existing file selection logic

    // After file is selected, scroll to line
    // This works for both regular and scoped diff
    scrollToLineInScopedDiff(line);
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

## Validation

```bash
npm run compile
npm run lint
```

### Manual Testing Checklist

1. Open Sidecar with TypeScript file changes
2. Verify scope hierarchy displays correctly
3. Verify changed scopes are expanded by default
4. Verify unchanged scopes are collapsed by default
5. Click unchanged scope header - verify it toggles
6. Click changed scope header - verify it does NOT collapse
7. Click "Expand All" - verify all scopes expand
8. Click "Collapse All" - verify only unchanged collapse
9. Click comment in sidebar - verify scope expands and scrolls
10. Add comment within a scope - verify it works
11. Switch to a file without LSP support - verify fallback message

## Architecture Compliance

- Adapter layer: UI rendering
- Receives state from extension via postMessage
- Sends messages for state changes
- No direct state mutation (all via extension)
