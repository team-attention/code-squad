# Task 2: Webview ContentView Component

## Objective

Create the ContentView component that renders external content in an iframe within the main panel area, including header with navigation buttons and loading/error states.

## Files to Create

### 1. `src/adapters/inbound/ui/webview/components/content/ContentView.ts`

**Component Structure:**
```typescript
export interface ContentViewProps {
    url: string;
    title: string;
}

/**
 * Renders content view with iframe, header, and navigation
 */
export function renderContentView(props: ContentViewProps): string {
    const { url, title } = props;
    const truncatedTitle = title.length > 50
        ? title.substring(0, 50) + '...'
        : title;

    return `
        <div class="content-view">
            <div class="content-view-loading" id="content-loading">
                <div class="loading-spinner"></div>
                <span>Loading content...</span>
            </div>
            <iframe
                class="content-view-iframe"
                id="content-iframe"
                src="${escapeHtml(url)}"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onload="document.getElementById('content-loading')?.classList.add('hidden')"
                onerror="handleContentError()"
            ></iframe>
            <div class="content-view-error hidden" id="content-error">
                <div class="error-icon">⚠️</div>
                <div class="error-text">Failed to load content</div>
                <div class="error-actions">
                    <button class="error-btn" onclick="retryContent()">Retry</button>
                    <button class="error-btn" onclick="openContentExternal()">Open in Browser</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Returns header HTML for content view
 */
export function renderContentViewHeader(title: string): string {
    const truncatedTitle = title.length > 40
        ? title.substring(0, 40) + '...'
        : title;

    return `
        <span class="diff-header-icon">🌐</span>
        <span class="diff-header-title content-title" title="${escapeHtml(title)}">${escapeHtml(truncatedTitle)}</span>
        <div class="content-view-actions">
            <button class="content-action-btn" id="content-back-btn" title="Back to previous view">
                ← Back
            </button>
            <button class="content-action-btn" id="content-external-btn" title="Open in browser">
                ↗ Open in Browser
            </button>
        </div>
    `;
}

function escapeHtml(text: string): string {
    const div = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return text.replace(/[&<>"']/g, c => div[c] || c);
}
```

### 2. `src/adapters/inbound/ui/webview/components/content/index.ts`

**Barrel export:**
```typescript
export { renderContentView, renderContentViewHeader, type ContentViewProps } from './ContentView';
```

## Files to Modify

### 3. `src/adapters/inbound/ui/webview/styles.ts`

**Add content view styles:**
```css
/* Content View Styles */
.content-view {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.content-view-iframe {
    flex: 1;
    width: 100%;
    border: none;
    background: var(--vscode-editor-background);
}

.content-view-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: var(--vscode-editor-background);
    z-index: 10;
}

.content-view-loading.hidden {
    display: none;
}

.content-view-loading .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--vscode-foreground);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.content-view-error {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: var(--vscode-editor-background);
}

.content-view-error.hidden {
    display: none;
}

.content-view-error .error-icon {
    font-size: 48px;
}

.content-view-error .error-text {
    color: var(--vscode-errorForeground);
    font-size: 14px;
}

.content-view-error .error-actions {
    display: flex;
    gap: 12px;
}

.content-view-error .error-btn {
    padding: 6px 16px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.content-view-error .error-btn:hover {
    background: var(--vscode-button-hoverBackground);
}

/* Content View Header Actions */
.content-view-actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
}

.content-action-btn {
    padding: 4px 12px;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
}

.content-action-btn:hover {
    background: var(--vscode-button-secondaryHoverBackground);
}

.content-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
```

### 4. `src/adapters/inbound/ui/webview/script.ts`

**Update renderState function to handle content view:**
```typescript
// At top, add import
import { renderContentView, renderContentViewHeader } from './components/content';

// In renderState function, add content view check FIRST:
async function renderState(state) {
    // Content view takes precedence
    if (state.contentView) {
        renderContentViewState(state.contentView);
        return;
    }

    // ... existing logic for waiting screen, scoped diff, diff
}

// Add new function:
function renderContentViewState(contentView: ContentViewState): void {
    const diffViewer = document.getElementById('diff-viewer');
    const viewerHeader = document.getElementById('viewer-header');
    const diffToolbar = document.getElementById('diff-toolbar');

    if (!diffViewer || !viewerHeader) return;

    // Update header
    viewerHeader.innerHTML = renderContentViewHeader(contentView.title);

    // Hide toolbar (not needed for content view)
    if (diffToolbar) {
        diffToolbar.style.display = 'none';
    }

    // Render content view
    diffViewer.innerHTML = renderContentView(contentView);

    // Attach event listeners
    attachContentViewListeners(contentView.url);
}

function attachContentViewListeners(url: string): void {
    const backBtn = document.getElementById('content-back-btn');
    const externalBtn = document.getElementById('content-external-btn');
    const iframe = document.getElementById('content-iframe') as HTMLIFrameElement;

    backBtn?.addEventListener('click', () => {
        vscode.postMessage({ type: 'closeContentView' });
    });

    externalBtn?.addEventListener('click', () => {
        vscode.postMessage({ type: 'openContentExternal', url });
    });

    // Handle iframe load error
    iframe?.addEventListener('error', () => {
        handleContentError();
    });
}

function handleContentError(): void {
    const loading = document.getElementById('content-loading');
    const error = document.getElementById('content-error');
    loading?.classList.add('hidden');
    error?.classList.remove('hidden');
}

function retryContent(): void {
    const iframe = document.getElementById('content-iframe') as HTMLIFrameElement;
    const loading = document.getElementById('content-loading');
    const error = document.getElementById('content-error');

    if (iframe) {
        loading?.classList.remove('hidden');
        error?.classList.add('hidden');
        iframe.src = iframe.src; // Reload
    }
}

// Make available globally for onclick handlers
(window as any).handleContentError = handleContentError;
(window as any).retryContent = retryContent;
(window as any).openContentExternal = () => {
    const iframe = document.getElementById('content-iframe') as HTMLIFrameElement;
    if (iframe?.src) {
        vscode.postMessage({ type: 'openContentExternal', url: iframe.src });
    }
};
```

## Test Scenarios

### TS-2.1: Content view renders with iframe
**Given:** state.contentView = { url: 'https://example.com', title: 'Example' }
**When:** renderState(state) called
**Then:** #diff-viewer contains iframe with src="https://example.com"

### TS-2.2: Header shows content title and back button
**Given:** Content view rendered
**When:** Checking header
**Then:** Header shows title text and "← Back" button

### TS-2.3: Loading spinner shown initially
**Given:** Content view rendering
**When:** iframe is loading
**Then:** Loading spinner visible, iframe loading in background

### TS-2.4: Loading spinner hidden on iframe load
**Given:** Content view with loading spinner
**When:** iframe onload fires
**Then:** Loading spinner hidden

### TS-2.5: Error state on load failure
**Given:** Content view with iframe
**When:** iframe fails to load
**Then:** Error UI shown with Retry and Open in Browser buttons

### TS-2.6: Back button posts closeContentView message
**Given:** Content view rendered
**When:** User clicks Back button
**Then:** vscode.postMessage({ type: 'closeContentView' }) called

### TS-2.7: Open in Browser button posts message
**Given:** Content view rendered
**When:** User clicks Open in Browser
**Then:** vscode.postMessage({ type: 'openContentExternal', url: '...' }) called

## Verification

```bash
npm run compile
npm run lint
```

## Acceptance Criteria

- [ ] ContentView.ts component created
- [ ] Barrel export index.ts created
- [ ] Content view styles added
- [ ] renderState routes to content view when state.contentView exists
- [ ] Header renders with title and navigation buttons
- [ ] Loading state displays during iframe load
- [ ] Error state displays on load failure
- [ ] Event listeners attached for buttons
- [ ] Code compiles without errors
- [ ] Lint passes
