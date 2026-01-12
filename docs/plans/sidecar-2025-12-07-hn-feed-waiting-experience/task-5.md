# Task 5: Create Internal WebviewPanel for Articles

**Layer**: Adapters (UI)
**Dependencies**: None

## Goal

Create a utility to open HN articles in a VSCode WebviewPanel instead of external browser, keeping the user within VSCode.

## Files to Modify

| File | Changes |
|------|---------|
| `src/adapters/inbound/ui/SidecarPanelAdapter.ts` | Add `openArticleInWebview()` method |

## Test Scenarios

### TS-5.1: Create WebviewPanel
- **Given** article URL and title
- **When** `openArticleInWebview()` is called
- **Then** new WebviewPanel should open in second column with iframe

### TS-5.2: Back Button Navigation
- **Given** WebviewPanel is open
- **When** user clicks back button
- **Then** panel should dispose and return to Sidecar

### TS-5.3: Resource Cleanup
- **Given** WebviewPanel is open
- **When** user closes panel
- **Then** resources should be properly disposed

### TS-5.4: Open in Browser Fallback
- **Given** WebviewPanel is showing article
- **When** user clicks "Open in Browser"
- **Then** article should open in external browser

## Implementation Guidance

### 1. Add Instance Variable for Panel Tracking

In `SidecarPanelAdapter.ts`, add after line 50:

```typescript
private articlePanel: vscode.WebviewPanel | undefined;
```

### 2. Implement openArticleInWebview Method

Add around line 700:

```typescript
private openArticleInWebview(url: string, title: string): void {
  // Dispose existing panel if any
  if (this.articlePanel) {
    this.articlePanel.dispose();
  }

  // Create new panel
  this.articlePanel = vscode.window.createWebviewPanel(
    'sidecarArticle',
    title.length > 30 ? title.substring(0, 30) + '...' : title,
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: false,
    }
  );

  // Set HTML content
  this.articlePanel.webview.html = this.getArticleWebviewContent(url, title);

  // Handle messages from webview
  this.articlePanel.webview.onDidReceiveMessage(
    message => {
      switch (message.type) {
        case 'goBack':
          this.articlePanel?.dispose();
          break;
        case 'openExternal':
          vscode.env.openExternal(vscode.Uri.parse(url));
          break;
      }
    },
    undefined,
    this.disposables
  );

  // Cleanup on dispose
  this.articlePanel.onDidDispose(() => {
    this.articlePanel = undefined;
  }, null, this.disposables);
}

private getArticleWebviewContent(url: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    frame-src https:;
    style-src 'unsafe-inline';
    script-src 'unsafe-inline';
  ">
  <title>${this.escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--vscode-editor-background);
      color: var(--vscode-foreground);
    }
    .header {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: var(--vscode-sideBar-background);
      border-bottom: 1px solid var(--vscode-widget-border);
      gap: 12px;
    }
    .header button {
      background: transparent;
      border: 1px solid var(--vscode-button-border, var(--vscode-contrastBorder));
      color: var(--vscode-foreground);
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .header button:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .header .title {
      flex: 1;
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    iframe {
      flex: 1;
      border: none;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="header">
    <button onclick="goBack()">← Back</button>
    <span class="title">${this.escapeHtml(title)}</span>
    <button onclick="openExternal()">Open in Browser</button>
  </div>
  <iframe src="${url}" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
  <script>
    const vscode = acquireVsCodeApi();
    function goBack() {
      vscode.postMessage({ type: 'goBack' });
    }
    function openExternal() {
      vscode.postMessage({ type: 'openExternal' });
    }
  </script>
</body>
</html>`;
}

private escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### 3. Add to dispose()

In the `dispose()` method, add:

```typescript
if (this.articlePanel) {
  this.articlePanel.dispose();
}
```

## Key Design Decisions

1. **Single Panel**: Only one article panel at a time to avoid clutter
2. **Column Two**: Opens beside the main editor, not replacing it
3. **CSP**: Allow https frames for article content
4. **Sandbox**: iframe sandbox for security while allowing scripts

## Validation

```bash
npm run compile
npm run lint
```

Method will be wired in Task 6.
