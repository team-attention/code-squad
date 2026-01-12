# Task 4: Integrate Highlighting in Diff Renderer

**Layer**: Adapter (UI/Webview)
**Dependencies**: Task 2, Task 3, Task 5

## Goal

Modify the diff rendering code in script.ts to apply syntax highlighting to code lines using the highlighter module.

## Files to Modify

| File | Changes |
|------|---------|
| `src/adapters/inbound/ui/webview/script.ts` | Integrate highlighter in diff rendering |

## Implementation Steps

### Step 1: Import Highlighter and Language Map

At the top of `script.ts`, add imports:

```typescript
import { highlightLines, preloadHighlighter, isHighlighterReady } from './highlighter';
import { getLanguageFromPath } from './languageMap';
```

### Step 2: Preload Highlighter on Init

In the initialization section (likely where state is first set up):

```typescript
// Preload highlighter for faster first render
preloadHighlighter();
```

### Step 3: Modify renderChunksToHtml Function

Find the function that renders diff chunks (likely `renderChunksToHtml` or similar).

The current flow is:
1. Iterate over chunks
2. Iterate over lines in chunk
3. Render each line as HTML with escaped content

New flow:
1. Detect language from file path
2. Collect all line contents
3. Highlight all lines at once (async)
4. Render with highlighted content

```typescript
async function renderChunksToHtml(
    diff: DiffDisplayState,
    comments: Comment[],
    // ... other params
): Promise<string> {
    const language = getLanguageFromPath(diff.file);

    // Collect all line contents for batch highlighting
    const allLines: string[] = [];
    const lineIndices: number[] = [];

    for (const chunk of diff.chunks) {
        for (let i = 0; i < chunk.lines.length; i++) {
            allLines.push(chunk.lines[i].content);
            lineIndices.push(allLines.length - 1);
        }
    }

    // Highlight all lines at once
    const highlightedLines = await highlightLines(allLines, language);

    // Build HTML using highlighted content
    let lineIndex = 0;
    let html = '';

    for (const chunk of diff.chunks) {
        html += renderChunkHeader(chunk);

        for (const line of chunk.lines) {
            const highlightedContent = highlightedLines[lineIndex++];
            html += renderDiffLine(line, highlightedContent, comments);
        }
    }

    return html;
}
```

### Step 4: Update renderDiffLine to Use Highlighted Content

```typescript
function renderDiffLine(
    line: DiffLine,
    highlightedContent: string,
    comments: Comment[]
): string {
    const typeClass = line.type; // 'addition' | 'deletion' | 'context'

    return `
        <tr class="diff-line ${typeClass}">
            <td class="diff-line-number">${line.oldLineNumber ?? ''}</td>
            <td class="diff-line-number">${line.newLineNumber ?? ''}</td>
            <td class="diff-content">
                <span class="shiki">${highlightedContent}</span>
            </td>
        </tr>
    `;
}
```

### Step 5: Handle Async Rendering

Since highlighting is async, ensure the render function is properly awaited:

```typescript
async function renderDiff(state: PanelState): Promise<void> {
    if (!state.diff) return;

    const html = await renderChunksToHtml(
        state.diff,
        state.comments,
        // ... other params
    );

    diffContainer.innerHTML = html;

    // Re-attach event listeners after render
    attachDiffLineListeners();
}
```

### Step 6: Graceful Fallback

If highlighter fails or isn't ready, fall back to plain text:

```typescript
async function highlightWithFallback(
    lines: string[],
    language: string
): Promise<string[]> {
    try {
        return await highlightLines(lines, language);
    } catch (error) {
        console.warn('Syntax highlighting failed, using plain text:', error);
        return lines.map(escapeHtml);
    }
}
```

## Validation

```bash
npm run compile    # No type errors
npm run lint       # No lint errors
```

## Tests

- [ ] TypeScript diff shows colored keywords, strings, etc.
- [ ] JavaScript diff shows syntax colors
- [ ] Python diff shows syntax colors
- [ ] Unknown file type shows plain text (no errors)
- [ ] Large diff (100+ lines) renders in <100ms
- [ ] Existing features still work:
  - [ ] Line selection
  - [ ] Comment creation
  - [ ] Search highlighting
  - [ ] Chunk collapse/expand

## Architecture Compliance

- Adapter layer: UI rendering
- Uses only webview modules (highlighter, languageMap)
- No domain/application layer changes
