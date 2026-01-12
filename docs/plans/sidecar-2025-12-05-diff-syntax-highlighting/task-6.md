# Task 6: Replace Markdown Preview highlightCode

**Layer**: Adapter (UI/Webview)
**Dependencies**: Task 2

## Goal

Replace the buggy regex-based `highlightCode` function in markdown preview with Shiki. The current implementation uses fragile placeholder patterns (`___HLPH0___`) that corrupt ASCII art, special characters, and cause rendering issues.

## Background

The current `highlightCode` function (lines ~972-1056 in script.ts):
- Uses regex patterns to identify keywords, strings, comments
- Stores matched patterns in placeholders (`___HLPH0___`, `___HLPH1___`, etc.)
- Restores placeholders after processing
- **Bug**: Unicode arrows (`────►`), special characters get misidentified and corrupted

## Files to Modify

| File | Changes |
|------|---------|
| `src/adapters/inbound/ui/webview/script.ts` | Replace `highlightCode` with Shiki-based implementation |

## Implementation Steps

### Step 1: Locate and Remove Old highlightCode

Find the `highlightCode` function (around line 972) and its usage. The function signature is:

```typescript
function highlightCode(code: string, lang: string): string
```

### Step 2: Create Shiki-based Replacement

```typescript
import { highlightCode as shikiHighlight } from './highlighter';

/**
 * Highlight code block for markdown preview
 * Uses Shiki for accurate TextMate-based tokenization
 */
async function highlightCodeBlock(code: string, lang: string): Promise<string> {
    // Map common language aliases
    const langMap: Record<string, string> = {
        'js': 'javascript',
        'ts': 'typescript',
        'tsx': 'tsx',
        'jsx': 'jsx',
        'py': 'python',
        'sh': 'shellscript',
        'bash': 'shellscript',
        'yml': 'yaml',
    };

    const normalizedLang = langMap[lang] || lang || 'plaintext';

    try {
        return await shikiHighlight(code, normalizedLang);
    } catch {
        // Fallback to escaped plain text
        return escapeHtml(code);
    }
}
```

### Step 3: Update Markdown Rendering to Use Async Highlighting

Find where code blocks are rendered in markdown (likely in `renderMarkdownPreview` or similar). Update to handle async:

```typescript
async function renderMarkdownPreview(content: string): Promise<string> {
    // ... existing markdown parsing ...

    // For each code block, use async highlighting
    const codeBlocks = extractCodeBlocks(content);
    const highlightedBlocks = await Promise.all(
        codeBlocks.map(block => highlightCodeBlock(block.code, block.lang))
    );

    // Replace code blocks with highlighted versions
    // ...
}
```

### Step 4: Handle Plain Text and Unknown Languages

For code blocks without a language specifier or with unsupported languages:

```typescript
// In highlighter.ts, ensure graceful fallback
if (lang === 'plaintext' || !isLanguageSupported(lang)) {
    // Return escaped code without highlighting
    return `<code>${escapeHtml(code)}</code>`;
}
```

### Step 5: Remove Old Helper Functions

Delete or comment out these helper functions that are no longer needed:
- The placeholder system (`savePlaceholder`, `___HLPH___` patterns)
- Regex-based keyword matching
- Type annotation regex matching

## Validation

```bash
npm run compile    # No type errors
npm run lint       # No lint errors
```

## Tests

- [ ] TypeScript code blocks render with syntax colors
- [ ] JavaScript code blocks render correctly
- [ ] Python code blocks render correctly
- [ ] ASCII art in code blocks renders without corruption
- [ ] Code blocks with special characters (`────►`, `│`, `└─`) render correctly
- [ ] Unknown language code blocks show plain text
- [ ] Empty code blocks don't cause errors
- [ ] Inline code (backticks) still works

## Architecture Compliance

- Adapter layer: UI rendering
- Uses highlighter module from Task 2
- No domain/application layer changes
