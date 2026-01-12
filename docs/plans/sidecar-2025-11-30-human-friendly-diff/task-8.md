# Task 8: Add Markdown Preview Mode

**Requirement**: R3.2
**Layer**: Adapters (Inbound/UI)
**Dependencies**: Task 7 (File Tree View)

## Goal

For markdown files:
- Render as preview by default
- Toggle button to switch between preview and diff view
- Support inline comments on preview mode

## Design

### Preview Mode UI
```
┌─────────────────────────────────────┐
│ README.md          [Preview] [Diff] │
├─────────────────────────────────────┤
│                                     │
│  # My Project                       │
│                                     │
│  This is a description...          │  ← Rendered markdown
│                                     │
│  ## Features                        │
│  - Feature 1                        │
│  - Feature 2                        │
│                                     │
└─────────────────────────────────────┘
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/application/ports/outbound/PanelState.ts` | Add view mode type |
| `src/adapters/inbound/ui/SidecarPanelAdapter.ts` | Implement markdown rendering |

## Implementation Steps

### Step 1: Extend PanelState

```typescript
// src/application/ports/outbound/PanelState.ts

export type DiffViewMode = 'diff' | 'preview';

export interface PanelState {
    // ... existing fields ...
    diffViewMode: DiffViewMode;  // Current view mode for diff viewer
}
```

### Step 2: Add Markdown Rendering Library

We'll use a lightweight markdown parser. Add to webview inline (no external dependency needed for basic markdown).

```javascript
// Simple markdown renderer (inline in webview)
function renderMarkdown(text) {
    // This is a simplified version. For production, consider using marked.js
    let html = escapeHtml(text);

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Lists
    html = html.replace(/^\- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Paragraphs (simple: double newline)
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');

    return html;
}
```

### Step 3: Add CSS for Preview Mode

```css
/* Add to <style> section */

.view-mode-toggle {
    display: flex;
    gap: 4px;
    margin-left: auto;
}

.view-mode-toggle button {
    width: auto;
    padding: 4px 12px;
    font-size: 11px;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border-radius: 4px;
}

.view-mode-toggle button.active {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
}

.markdown-preview {
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: var(--vscode-foreground);
    overflow: auto;
    height: 100%;
}

.markdown-preview h1 {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--vscode-panel-border);
}

.markdown-preview h2 {
    font-size: 20px;
    font-weight: 600;
    margin: 24px 0 12px 0;
}

.markdown-preview h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 20px 0 8px 0;
}

.markdown-preview p {
    margin: 0 0 12px 0;
}

.markdown-preview ul, .markdown-preview ol {
    margin: 0 0 12px 0;
    padding-left: 24px;
}

.markdown-preview li {
    margin: 4px 0;
}

.markdown-preview code {
    font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    background: var(--vscode-textCodeBlock-background);
    padding: 2px 6px;
    border-radius: 4px;
}

.markdown-preview pre {
    background: var(--vscode-textCodeBlock-background);
    padding: 12px 16px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 0 0 12px 0;
}

.markdown-preview pre code {
    background: none;
    padding: 0;
}

.markdown-preview a {
    color: var(--vscode-textLink-foreground);
    text-decoration: none;
}

.markdown-preview a:hover {
    text-decoration: underline;
}

.markdown-preview strong {
    font-weight: 600;
}

/* Inline comment markers in preview */
.preview-comment-marker {
    display: inline-block;
    background: var(--vscode-textLink-foreground);
    color: var(--vscode-editor-background);
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 4px;
    margin-left: 4px;
    cursor: pointer;
    vertical-align: super;
}

.preview-comment-marker:hover {
    opacity: 0.8;
}
```

### Step 4: Update renderDiff Function

```javascript
function renderDiff(diff, selectedFile, viewMode) {
    const header = document.querySelector('.diff-header-title');
    const stats = document.getElementById('diff-stats');
    const viewer = document.getElementById('diff-viewer');

    // Check if markdown file
    const isMarkdown = selectedFile && (
        selectedFile.endsWith('.md') ||
        selectedFile.endsWith('.markdown') ||
        selectedFile.endsWith('.mdx')
    );

    // Update header with view mode toggle for markdown
    if (isMarkdown && diff && diff.chunks && diff.chunks.length > 0) {
        header.textContent = diff.file;

        // Add view mode toggle
        const toggleHtml = `
            <div class="view-mode-toggle">
                <button class="${viewMode === 'preview' ? 'active' : ''}"
                        onclick="setDiffViewMode('preview')">Preview</button>
                <button class="${viewMode === 'diff' ? 'active' : ''}"
                        onclick="setDiffViewMode('diff')">Diff</button>
            </div>
        `;
        stats.innerHTML = `
            <span class="stat-added">+${diff.stats.additions}</span>
            <span class="stat-removed">-${diff.stats.deletions}</span>
        ` + toggleHtml;

        // Render based on mode
        if (viewMode === 'preview') {
            renderMarkdownPreview(diff, viewer);
            return;
        }
    } else if (diff && diff.chunks) {
        // Non-markdown: normal stats
        stats.innerHTML = `
            <span class="stat-added">+${diff.stats.additions}</span>
            <span class="stat-removed">-${diff.stats.deletions}</span>
        `;
    }

    // Default diff rendering
    if (!diff || !diff.chunks || diff.chunks.length === 0) {
        // ... existing empty state code ...
        return;
    }

    header.textContent = diff.file;
    viewer.innerHTML = '<table class="diff-table">' + renderChunksToHtml(diff.chunks, diff.chunkStates || []) + '</table>';
    setupLineHoverHandlers(diff.file);
    setupChunkToggleHandlers();
}

function renderMarkdownPreview(diff, container) {
    // Extract new content from diff (additions and context lines)
    let content = '';
    for (const chunk of diff.chunks) {
        for (const line of chunk.lines) {
            if (line.type === 'addition' || line.type === 'context') {
                content += line.content + '\n';
            }
        }
    }

    // Render markdown
    const rendered = renderMarkdown(content);

    container.innerHTML = `
        <div class="markdown-preview">
            ${rendered}
        </div>
    `;

    // Add comment functionality to preview
    setupPreviewComments(container, diff.file);
}

function setupPreviewComments(container, file) {
    // Allow text selection for commenting
    container.addEventListener('mouseup', () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            // Show comment prompt for selected text
            const selectedText = selection.toString().trim();
            const range = selection.getRangeAt(0);

            // Create comment button near selection
            const marker = document.createElement('span');
            marker.className = 'preview-comment-marker';
            marker.textContent = '+';
            marker.onclick = () => {
                showPreviewCommentForm(file, selectedText, marker);
            };

            range.collapse(false);
            range.insertNode(marker);
        }
    });
}

function showPreviewCommentForm(file, selectedText, markerElement) {
    // Remove any existing form
    const existingForm = document.querySelector('.preview-comment-form');
    if (existingForm) existingForm.remove();

    const form = document.createElement('div');
    form.className = 'inline-comment-form active preview-comment-form';
    form.style.position = 'absolute';
    form.style.zIndex = '1000';
    form.style.width = '300px';

    // Position near marker
    const rect = markerElement.getBoundingClientRect();
    form.style.top = (rect.bottom + 4) + 'px';
    form.style.left = rect.left + 'px';

    form.innerHTML = `
        <div class="comment-form-header">Comment on: "${escapeHtml(selectedText.substring(0, 30))}..."</div>
        <textarea class="comment-textarea" placeholder="Leave a comment..."></textarea>
        <div class="comment-form-actions">
            <button class="btn-secondary" onclick="this.closest('.preview-comment-form').remove()">Cancel</button>
            <button onclick="submitPreviewComment('${escapeHtml(file)}', '${escapeHtml(selectedText)}', this)">Add Comment</button>
        </div>
    `;

    document.body.appendChild(form);
    form.querySelector('textarea').focus();
}

window.submitPreviewComment = function(file, context, btn) {
    const form = btn.closest('.preview-comment-form');
    const text = form.querySelector('textarea').value;

    if (text) {
        vscode.postMessage({
            type: 'addComment',
            file: file,
            line: 1,  // Preview comments don't have specific lines
            text: text,
            context: context
        });
    }

    form.remove();
};

window.setDiffViewMode = function(mode) {
    vscode.postMessage({ type: 'setDiffViewMode', mode });
};
```

### Step 5: Handle View Mode Message

```typescript
// In SidecarPanelAdapter.ts onDidReceiveMessage handler
case 'setDiffViewMode':
    this.panelStateManager?.setDiffViewMode(message.mode);
    break;

// In IPanelStateManager
export interface IPanelStateManager {
    // ... existing methods ...
    setDiffViewMode(mode: DiffViewMode): void;
}
```

## Validation

```bash
npm run compile
# Manual test: Select .md file → shows Preview mode by default
# Manual test: Click "Diff" button → shows diff view
# Manual test: Click "Preview" button → back to preview
# Manual test: Select text in preview → can add comment
```

## Architecture Compliance

- UI rendering in Inbound Adapter (SidecarPanelAdapter) ✓
- State management in Application layer ✓
- Markdown parsing is pure client-side logic ✓
