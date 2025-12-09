import { webviewStyles } from './styles';
import { webviewHtml } from './html';

export function getWebviewContent(bundledScriptUri?: string): string {
    // The bundled script (dist/webview.js) contains all webview logic:
    // - Shiki syntax highlighter
    // - State management
    // - All UI components
    // - Event handlers
    const bundledScript = bundledScriptUri
        ? `<script src="${bundledScriptUri}"></script>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sidecar</title>
    <style>${webviewStyles}</style>
</head>
${webviewHtml}
${bundledScript}
</body>
</html>`;
}
