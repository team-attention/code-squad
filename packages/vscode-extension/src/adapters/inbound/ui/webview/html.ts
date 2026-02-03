export const webviewHtml = `
<body class="sidebar-collapsed">
  <div class="sidebar collapsed">
    <div class="header">
      <h2 id="header-title">Code Squad</h2>
      <div class="status" id="status-badge">
        <span id="ai-status-dot">●</span>
        <span id="ai-type">Ready</span>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h3>Changed Files</h3>
        <div class="toggle-row" id="toggle-row" style="display: none;">
          <span class="toggle-label">+<span id="uncommitted-count">0</span> prior changes</span>
          <div class="toggle-checkbox" id="uncommitted-toggle"></div>
        </div>
      </div>
      <div class="files-toolbar">
        <button class="toggle-btn" id="view-mode-toggle">List</button>
        <div class="search-container">
          <input type="text"
                 id="file-search"
                 class="search-input"
                 placeholder="Search files..."
                 autocomplete="off">
          <button class="search-clear" id="search-clear" style="display: none;">×</button>
        </div>
      </div>
      <div id="search-results" class="search-results" style="display: none;"></div>
      <div id="files-list">
              </div>
    </div>

    <div class="section">
      <h3>Comments</h3>
      <div id="comments-list">
        <div class="empty-text">No comments yet</div>
      </div>
      <button id="submit-comments" style="margin-top: 12px;">Ask AI</button>
    </div>
  </div>

  <div class="resizer" id="panel-resizer"></div>

  <div class="main-content">
    <div class="diff-header" id="viewer-header">
      <span class="diff-header-icon">📄</span>
      <span class="diff-header-title">Select a file to review</span>
      <div class="diff-stats" id="diff-stats"></div>
      <button class="sidebar-toggle" id="toggle-sidebar" aria-label="Expand file list panel">&lt;</button>
    </div>

    <div class="diff-toolbar" id="diff-toolbar" style="display: none;">
      <button class="toggle-btn" id="diff-collapse-all">Collapse</button>
      <div class="diff-search-wrapper">
        <input type="text"
               id="diff-search-input"
               class="diff-search-input"
               placeholder="Find in diff..."
               autocomplete="off">
        <span class="diff-search-count" id="diff-search-count"></span>
        <button class="diff-search-nav" id="diff-search-prev" title="Previous (Shift+Enter)">↑</button>
        <button class="diff-search-nav" id="diff-search-next" title="Next (Enter)">↓</button>
      </div>
    </div>

    <div class="diff-container" id="diff-viewer">
      <div class="placeholder">
        <div class="placeholder-icon">📝</div>
        <div class="placeholder-text">Select a modified file to view changes</div>
      </div>
    </div>
  </div>
`;
