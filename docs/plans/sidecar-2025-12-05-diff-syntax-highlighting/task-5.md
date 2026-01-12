# Task 5: Add Language Detection Utility

**Layer**: Adapter (UI/Webview)
**Dependencies**: None

## Goal

Create a utility module that maps file extensions to Shiki language identifiers, enabling automatic language detection for syntax highlighting.

## Files to Create

| File | Purpose |
|------|---------|
| `src/adapters/inbound/ui/webview/languageMap.ts` | File extension to language mapping |

## Implementation Steps

### Step 1: Create languageMap.ts

```typescript
// src/adapters/inbound/ui/webview/languageMap.ts

/**
 * Maps file extensions to Shiki language identifiers
 * Only includes languages that are bundled in highlighter.ts
 */

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
    // TypeScript
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.mts': 'typescript',
    '.cts': 'typescript',

    // JavaScript
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.mjs': 'javascript',
    '.cjs': 'javascript',

    // Python
    '.py': 'python',
    '.pyw': 'python',
    '.pyi': 'python',

    // Go
    '.go': 'go',

    // Rust
    '.rs': 'rust',

    // Java
    '.java': 'java',

    // C/C++
    '.c': 'c',
    '.h': 'c',
    '.cpp': 'cpp',
    '.cc': 'cpp',
    '.cxx': 'cpp',
    '.hpp': 'cpp',
    '.hxx': 'cpp',

    // Data formats
    '.json': 'json',
    '.jsonc': 'jsonc',
    '.yaml': 'yaml',
    '.yml': 'yaml',

    // Web
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',

    // Markdown
    '.md': 'markdown',
    '.mdx': 'mdx',

    // Shell
    '.sh': 'shellscript',
    '.bash': 'shellscript',
    '.zsh': 'shellscript',
    '.fish': 'shellscript',

    // Config files (map to closest language)
    '.env': 'shellscript',
    '.gitignore': 'shellscript',
};

/**
 * Special filename mappings (case-insensitive)
 */
const FILENAME_TO_LANGUAGE: Record<string, string> = {
    'dockerfile': 'dockerfile',
    'makefile': 'makefile',
    'cmakelists.txt': 'cmake',
    '.gitignore': 'shellscript',
    '.env': 'shellscript',
    '.env.local': 'shellscript',
    '.env.development': 'shellscript',
    '.env.production': 'shellscript',
};

/**
 * Get Shiki language identifier from file path
 * Returns 'plaintext' for unknown extensions
 */
export function getLanguageFromPath(filePath: string): string {
    // Extract filename from path
    const parts = filePath.split(/[/\\]/);
    const filename = parts[parts.length - 1].toLowerCase();

    // Check special filenames first
    if (FILENAME_TO_LANGUAGE[filename]) {
        return FILENAME_TO_LANGUAGE[filename];
    }

    // Extract extension
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) {
        return 'plaintext';
    }

    const extension = filename.slice(lastDot).toLowerCase();
    return EXTENSION_TO_LANGUAGE[extension] || 'plaintext';
}

/**
 * Check if a language is supported for highlighting
 */
export function isLanguageSupported(language: string): boolean {
    const supportedLanguages = new Set([
        'typescript',
        'tsx',
        'javascript',
        'jsx',
        'python',
        'go',
        'rust',
        'java',
        'c',
        'cpp',
        'json',
        'jsonc',
        'yaml',
        'html',
        'css',
        'scss',
        'less',
        'markdown',
        'mdx',
        'shellscript',
    ]);

    return supportedLanguages.has(language);
}

/**
 * Get file extension from path (for display purposes)
 */
export function getExtension(filePath: string): string {
    const parts = filePath.split(/[/\\]/);
    const filename = parts[parts.length - 1];
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.slice(lastDot);
}
```

## Validation

```bash
npm run compile    # No type errors
npm run lint       # No lint errors
```

## Tests

- [ ] `.ts` → `typescript`
- [ ] `.tsx` → `tsx`
- [ ] `.js` → `javascript`
- [ ] `.py` → `python`
- [ ] `.go` → `go`
- [ ] `.unknown` → `plaintext`
- [ ] `Dockerfile` → `dockerfile`
- [ ] `path/to/file.ts` extracts correctly

## Architecture Compliance

- Adapter layer: UI utility
- Pure function, no side effects
- No imports from other layers
