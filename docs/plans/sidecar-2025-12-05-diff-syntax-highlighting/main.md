# Implementation Plan: Diff View Syntax Highlighting

**Slug**: `sidecar-2025-12-05-diff-syntax-highlighting`
**Spec**: `docs/specs/sidecar-2025-12-05-diff-syntax-highlighting.md`
**Size**: MEDIUM (6 tasks)
**Estimated Files**: 8

## Scope Summary

| Phase | Description | Tasks |
|-------|-------------|-------|
| Phase 1 | Infrastructure setup | Task 1 |
| Phase 2 | Core tokenization | Task 2-3 |
| Phase 3 | UI integration | Task 4-6 |

**Scope Extension**: Also replaces the buggy regex-based `highlightCode` function in markdown preview with Shiki. The current implementation uses fragile placeholders (`___HLPH0___`) that corrupt ASCII art and special characters.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Highlighting library | Shiki | Same TextMate engine as VS Code, accurate highlighting |
| Tokenization location | Webview (client-side) | Simpler architecture, no message passing needed |
| Theme handling | VS Code CSS variables | Consistent with editor, auto light/dark support |
| Bundle strategy | Fine-grained (core + common languages) | Balance bundle size (~100KB) vs language support |
| Language detection | File extension mapping | Simple, reliable, matches spec requirement |

## Technical Design

### Data Flow

```
Extension                              Webview
┌─────────────────────┐               ┌──────────────────────────┐
│ GenerateDiffUseCase │               │ script.ts                │
│ - DiffResult with   │──postMessage──│ - Receive diff data      │
│   file path         │               │ - Detect language from   │
│                     │               │   file extension         │
└─────────────────────┘               │ - Tokenize with Shiki    │
                                      │ - Render with token spans│
                                      └──────────────────────────┘
```

### Shiki Integration

1. **Bundle Configuration**: Use `shiki/core` with only common languages
2. **Languages**: TypeScript, JavaScript, Python, Go, Rust, Java, C/C++, JSON, YAML, HTML, CSS, Markdown, Shell (13 languages covering most use cases)
3. **Themes**: Use VS Code default theme colors via CSS variables
4. **Caching**: Highlighter instance cached after first initialization

### CSS Token Mapping

```css
/* Map Shiki token types to CSS variables */
.shiki .token-keyword { color: var(--vscode-symbolIcon-keywordForeground); }
.shiki .token-string { color: var(--vscode-symbolIcon-stringForeground); }
.shiki .token-function { color: var(--vscode-symbolIcon-functionForeground); }
/* ... etc */
```

### Diff Line Rendering

```html
<!-- Before: plain text -->
<td class="diff-content">const foo = "bar";</td>

<!-- After: tokenized -->
<td class="diff-content">
  <span class="token-keyword">const</span>
  <span class="token-variable"> foo</span>
  <span class="token-operator"> = </span>
  <span class="token-string">"bar"</span>
  <span class="token-punctuation">;</span>
</td>
```

## Task Overview

| Task | Description | Files | Dependencies |
|------|-------------|-------|--------------|
| 1 | Install and configure Shiki | 3 | None |
| 2 | Create syntax highlighter module | 2 | Task 1 |
| 3 | Add token CSS styles | 1 | None |
| 4 | Integrate highlighting in diff renderer | 1 | Task 2, 3, 5 |
| 5 | Add language detection utility | 1 | None |
| 6 | Replace markdown preview highlightCode | 1 | Task 2 |

## Layer Changes

```
src/
├── adapters/
│   └── inbound/
│       └── ui/
│           └── webview/
│               ├── script.ts           # Task 4,6: Use highlighter (diff + markdown)
│               ├── styles.ts           # Task 3: Add token CSS
│               ├── highlighter.ts      # Task 2: NEW - Shiki wrapper
│               └── languageMap.ts      # Task 5: NEW - Extension→Language
│
├── package.json                        # Task 1: Add shiki dependency
└── esbuild.js                          # Task 1: Configure bundling
```

## Dependency Graph

- Task 1 (Install Shiki) -> Task 2 (Highlighter Module)
- Task 2 -> Task 4 (Diff Integration)
- Task 2 -> Task 6 (Markdown Preview)
- Task 3 (Token CSS) -> Task 4
- Task 5 (Language Map) -> Task 4

## Execution Order

**Parallel batch 1**: Task 1, Task 3, Task 5 (independent)
**Sequential after batch 1**: Task 2 (depends on Task 1)
**Parallel batch 2**: Task 4, Task 6 (both depend on Task 2)

## Files

- [Task 1: Install and Configure Shiki](./task-1.md)
- [Task 2: Create Syntax Highlighter Module](./task-2.md)
- [Task 3: Add Token CSS Styles](./task-3.md)
- [Task 4: Integrate Highlighting in Diff Renderer](./task-4.md)
- [Task 5: Add Language Detection Utility](./task-5.md)
- [Task 6: Replace Markdown Preview highlightCode](./task-6.md)

## Validation

After implementation:
1. `npm run compile` - No build errors
2. `npm run lint` - No lint errors
3. Manual test: Open Sidecar with a TypeScript file change, verify syntax colors appear
4. Manual test: Check diff with JavaScript, Python, Go files
5. Manual test: Verify existing features still work (comments, search, collapse)
6. Performance test: Large diff (100+ lines) renders without noticeable delay
7. Manual test: Markdown preview shows syntax-highlighted code blocks
8. Manual test: ASCII art/diagrams in markdown code blocks render correctly (no corruption)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Bundle size increase | Slower load | Use fine-grained bundle, only common languages |
| Shiki init delay | First render slow | Lazy init, show plain text until ready |
| CSP issues in webview | Shiki WASM fails | Use JavaScript RegExp engine (no WASM) |
| Theme mismatch | Colors look wrong | Test with multiple VS Code themes |

## Out of Scope (per spec)

- Semantic highlighting (requires language server)
- Custom theme configuration
- Syntax highlighting in comments
- Side-by-side diff mode
- Real-time re-tokenization on theme change
