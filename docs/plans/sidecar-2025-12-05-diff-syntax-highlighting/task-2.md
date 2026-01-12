# Task 2: Create Syntax Highlighter Module

**Layer**: Adapter (UI/Webview)
**Dependencies**: Task 1

## Goal

Create a module that wraps Shiki for use in the webview, providing a simple API to tokenize code lines.

## Files to Create

| File | Purpose |
|------|---------|
| `src/adapters/inbound/ui/webview/highlighter.ts` | Shiki wrapper with lazy initialization |

## Implementation Steps

### Step 1: Create highlighter.ts

```typescript
// src/adapters/inbound/ui/webview/highlighter.ts

import { createHighlighterCore, HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

// Import only common languages
import langTypescript from 'shiki/langs/typescript.mjs';
import langJavascript from 'shiki/langs/javascript.mjs';
import langPython from 'shiki/langs/python.mjs';
import langGo from 'shiki/langs/go.mjs';
import langRust from 'shiki/langs/rust.mjs';
import langJava from 'shiki/langs/java.mjs';
import langCpp from 'shiki/langs/cpp.mjs';
import langC from 'shiki/langs/c.mjs';
import langJson from 'shiki/langs/json.mjs';
import langYaml from 'shiki/langs/yaml.mjs';
import langHtml from 'shiki/langs/html.mjs';
import langCss from 'shiki/langs/css.mjs';
import langMarkdown from 'shiki/langs/markdown.mjs';
import langShell from 'shiki/langs/shellscript.mjs';

// Theme that outputs class names (not inline styles)
import themeVitesseDark from 'shiki/themes/vitesse-dark.mjs';

let highlighterPromise: Promise<HighlighterCore> | null = null;
let highlighter: HighlighterCore | null = null;

const SUPPORTED_LANGUAGES = [
    langTypescript,
    langJavascript,
    langPython,
    langGo,
    langRust,
    langJava,
    langCpp,
    langC,
    langJson,
    langYaml,
    langHtml,
    langCss,
    langMarkdown,
    langShell,
];

/**
 * Initialize the highlighter (lazy, cached)
 */
async function initHighlighter(): Promise<HighlighterCore> {
    if (highlighter) {
        return highlighter;
    }

    if (!highlighterPromise) {
        highlighterPromise = createHighlighterCore({
            themes: [themeVitesseDark],
            langs: SUPPORTED_LANGUAGES,
            engine: createJavaScriptRegexEngine(),
        });
    }

    highlighter = await highlighterPromise;
    return highlighter;
}

/**
 * Highlight a single line of code
 * Returns HTML string with token spans
 */
export async function highlightLine(
    code: string,
    language: string
): Promise<string> {
    const hl = await initHighlighter();

    // Check if language is supported
    const loadedLangs = hl.getLoadedLanguages();
    if (!loadedLangs.includes(language)) {
        // Return escaped plain text
        return escapeHtml(code);
    }

    try {
        const html = hl.codeToHtml(code, {
            lang: language,
            theme: 'vitesse-dark',
        });

        // Extract inner content (remove outer <pre><code> tags)
        const match = html.match(/<code[^>]*>([\s\S]*)<\/code>/);
        return match ? match[1] : escapeHtml(code);
    } catch {
        return escapeHtml(code);
    }
}

/**
 * Highlight multiple lines efficiently
 */
export async function highlightLines(
    lines: string[],
    language: string
): Promise<string[]> {
    const hl = await initHighlighter();

    const loadedLangs = hl.getLoadedLanguages();
    if (!loadedLangs.includes(language)) {
        return lines.map(escapeHtml);
    }

    // Join lines, highlight as block, then split
    const code = lines.join('\n');
    try {
        const html = hl.codeToHtml(code, {
            lang: language,
            theme: 'vitesse-dark',
        });

        const match = html.match(/<code[^>]*>([\s\S]*)<\/code>/);
        if (match) {
            // Split by line break spans
            return match[1].split('\n');
        }
    } catch {
        // Fall through to plain text
    }

    return lines.map(escapeHtml);
}

/**
 * Check if highlighter is ready (for sync checks)
 */
export function isHighlighterReady(): boolean {
    return highlighter !== null;
}

/**
 * Preload the highlighter (call early to reduce first-render delay)
 */
export function preloadHighlighter(): void {
    initHighlighter().catch(console.error);
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
```

### Step 2: Export from webview index

Update `src/adapters/inbound/ui/webview/index.ts` to export the highlighter module if needed for testing.

## Validation

```bash
npm run compile    # No type errors
npm run lint       # No lint errors
```

## Tests

- [ ] Highlighter initializes without error
- [ ] TypeScript code is tokenized correctly
- [ ] Unsupported language returns plain escaped text
- [ ] Multiple calls reuse cached highlighter instance

## Architecture Compliance

- Adapter layer: UI component
- No domain/application imports
- Self-contained module for webview use
