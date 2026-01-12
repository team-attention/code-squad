# Changes: Diff Syntax Highlighting

**Slug**: sidecar-2025-12-05-diff-syntax-highlighting
**Date**: 2025-12-05
**Spec**: [diff-syntax-highlighting.md](../specs/diff-syntax-highlighting.md)
**Plan**: [sidecar-2025-12-05-diff-syntax-highlighting](../plans/sidecar-2025-12-05-diff-syntax-highlighting/)

## Summary

Implemented syntax highlighting for diff content using Shiki, a TextMate grammar-based highlighter.

## Changes

### New Files

- `src/adapters/inbound/ui/webview/webview-entry.ts` - Webview entry point bundled separately with Shiki integration. Contains:
  - Shiki highlighter initialization with JavaScript RegExp engine (CSP compliant)
  - Language detection from file paths
  - `highlightLines()` - Batch highlight multiple lines efficiently
  - `highlightCodeBlock()` - Highlight code blocks for markdown
  - Exposed as `window.SidecarHighlighter` API for webview scripts

### Modified Files

- `package.json`
  - Added `shiki` dependency (^3.19.0)
  - Added `esbuild-webview` script for separate webview bundling
  - Updated `vscode:prepublish` to include webview build

- `tsconfig.json`
  - Excluded `webview-entry.ts` from TypeScript compilation (bundled by esbuild)

- `src/adapters/inbound/ui/webview/template.ts`
  - Added optional `highlighterScriptUri` parameter
  - Loads bundled highlighter script before main webview script

- `src/adapters/inbound/ui/SidecarPanelAdapter.ts`
  - Added `dist` to `localResourceRoots` for webview
  - Generates webview URI for highlighter script bundle

- `src/adapters/inbound/ui/webview/script.ts`
  - Made `renderDiff()` async, uses `SidecarHighlighter.getLanguageFromPath()`
  - Made `renderChunksToHtml()` async, batch highlights all lines via `SidecarHighlighter.highlightLines()`
  - Added `highlightCodeAsync()` using `SidecarHighlighter.highlightCodeBlock()`
  - Made `renderMarkdown()` async with parallel code block highlighting
  - Made `renderMarkdownPreview()` and `renderFullMarkdownWithHighlights()` async
  - Removed old regex-based `highlightCode()` function

- `src/adapters/inbound/ui/webview/styles.ts`
  - Added syntax highlighting CSS styles
  - Override Shiki's default backgrounds for transparency
  - Dim syntax colors for deleted lines (0.85 opacity)

### Supported Languages

TypeScript, JavaScript, Python, JSON, YAML, HTML, CSS, Markdown, Shell script

### Architecture

```
webview-entry.ts (bundled by esbuild → dist/webview.js)
       ↓
  window.SidecarHighlighter API
       ↓
script.ts (uses API for highlighting)
```

The highlighter is bundled separately (~1MB) and loaded as an external script in the webview. This keeps the main extension bundle small while providing full syntax highlighting capabilities.

## Validation

- [x] `npm run compile` - TypeScript compilation passes
- [x] `npm run esbuild` - Both extension and webview bundles build successfully
- [ ] Manual testing - Visual verification of syntax highlighting in diff viewer

## Notes

- Bundle size: webview.js is ~1MB (unminified). Minified production build will be smaller.
- Only essential languages bundled to minimize size (no Go, Rust, Java, C/C++ in initial version)
- Uses JavaScript RegExp engine instead of Oniguruma for CSP compliance
