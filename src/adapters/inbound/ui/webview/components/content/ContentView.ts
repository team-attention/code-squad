/**
 * Content View Component
 *
 * Renders external content (HN articles, URLs) in an iframe within the main panel area.
 * Includes header with navigation buttons and loading/error states.
 */

export interface ContentViewProps {
    url: string;
    title: string;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
    const escapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (c) => escapeMap[c] || c);
}

/**
 * Renders content view with iframe, loading state, and error handling
 */
export function renderContentView(props: ContentViewProps): string {
    const { url } = props;

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
            ></iframe>
            <div class="content-view-error hidden" id="content-error">
                <div class="error-icon">⚠️</div>
                <div class="error-text">Failed to load content</div>
                <div class="error-actions">
                    <button class="error-btn" id="content-retry-btn">Retry</button>
                    <button class="error-btn" id="content-external-error-btn">Open in Browser</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Returns header HTML for content view
 */
export function renderContentViewHeader(props: { title: string }): string {
    const { title } = props;
    const truncatedTitle =
        title.length > 40 ? title.substring(0, 40) + '...' : title;

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
