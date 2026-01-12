# Diff View Syntax Highlighting

## Summary
Add syntax highlighting to the unified diff view to improve code readability by colorizing keywords, strings, functions, and other code elements based on file language.

## Background
Currently, the diff view displays code changes with only basic styling (green for additions, red for deletions). Code content appears in monospace font but lacks syntax highlighting, making it harder to distinguish between variable names, keywords, strings, and other programming constructs compared to the main editor.

The extension already implements basic syntax highlighting for markdown preview mode (see `highlightCode` function in `script.ts`), but this is limited to code blocks within markdown files and uses a simple regex-based approach.

## Requirements

### Functional
- [ ] Apply syntax highlighting to all code lines in the unified diff table view
- [ ] Support the same programming languages that VS Code's built-in editor supports
- [ ] Preserve existing diff highlighting (additions in green, deletions in red) while adding syntax colors on top
- [ ] Maintain performance - syntax highlighting should not cause noticeable lag when rendering diffs
- [ ] Use VS Code theme colors for consistency with the main editor experience
- [ ] Language detection should be automatic based on file extension

### Non-Functional
- **Performance**: Highlighting should complete in <100ms for typical diff chunks (50-100 lines)
- **Consistency**: Use VS Code's semantic token colors (variables, keywords, functions, etc.) to match editor appearance
- **Accessibility**: Maintain sufficient color contrast ratios; syntax colors should work with both light and dark themes
- **Maintainability**: Solution should leverage existing VS Code APIs rather than maintaining custom grammar files

## Technical Approach

### Option 1: VS Code TextMate Grammar (Recommended)
Use VS Code's tokenization API through the webview message passing system:
- Main extension process uses `vscode.languages.getLanguages()` and VS Code's tokenization service
- Pre-tokenize diff content on the extension side before sending to webview
- Webview receives tokenized data with color classes and applies styling using CSS variables mapped to VS Code theme tokens

**Pros:**
- Leverages VS Code's existing language grammars (100+ languages)
- Consistent with editor appearance
- Minimal maintenance burden
- Accurate tokenization

**Cons:**
- Requires message passing between webview and extension
- More complex implementation than client-side solution

### Option 2: highlight.js / Prism.js
Integrate a JavaScript syntax highlighting library directly in the webview:
- Add library bundle to webview assets
- Apply highlighting client-side when rendering diff chunks
- Map library's color classes to VS Code theme colors

**Pros:**
- Self-contained in webview
- No message passing required
- Simpler initial implementation

**Cons:**
- Additional bundle size (~50-100KB)
- May not match VS Code themes exactly
- Need to maintain language mappings
- Less accurate tokenization than TextMate grammars

### Recommended Solution
**Option 1** is recommended because:
1. Better consistency with VS Code editor
2. No additional dependencies/bundle size
3. More accurate syntax highlighting
4. Leverages existing VS Code infrastructure

## Implementation Considerations

### File Language Detection
- Use file extension mapping (`.ts` → TypeScript, `.py` → Python, etc.)
- Fallback to plain text for unknown extensions

### Tokenization Strategy
- Tokenize per-line to align with diff line structure
- Cache tokenization results for unchanged context lines
- Apply tokenization after diff parsing but before webview rendering

### CSS Integration
- Define token color CSS variables that map to VS Code theme tokens:
  - `--token-keyword`: Keywords (if, function, class, etc.)
  - `--token-string`: String literals
  - `--token-comment`: Comments
  - `--token-function`: Function names
  - `--token-variable`: Variables
  - `--token-type`: Type names
  - `--token-number`: Numeric literals
- Overlay syntax colors on top of existing diff background colors using appropriate opacity/blending

### Data Flow
```
Extension Process:
1. Generate diff → DiffResult
2. Detect language from file extension
3. Tokenize each DiffLine.content using VS Code API
4. Attach token data to each line
5. Send enhanced diff to webview

Webview:
1. Receive diff with token data
2. Render HTML with token spans
3. Apply CSS classes based on token types
4. Preserve existing diff styling (backgrounds, borders)
```

## Out of Scope
- Syntax highlighting for markdown preview mode improvements (already exists)
- Semantic highlighting (requires language server integration)
- Custom theme configuration for syntax colors
- Syntax highlighting in comment text or commit messages
- Inline diff mode (side-by-side view) - focusing only on unified diff
- Real-time re-tokenization on theme changes (acceptable to require panel reload)

## Open Questions
1. ~~**Performance Impact**~~: Resolved - diff view only renders specific parts of the file, not the entire file, so tokenization volume is manageable.
2. **Caching Strategy**: Attach tokenized data to diff information and hold in memory. Details TBD during implementation.
3. **Partial Tokenization**: May cause issues with scope detection (e.g., multi-line strings, block comments). Tokenize full diff chunks to ensure accurate coloring. Not a priority optimization.
4. ~~**Diff Search Interaction**~~: Resolved - clear separation:
   - Search highlighting → **background color**
   - Syntax highlighting → **text color**
   - No conflict since they use different CSS properties.

## Success Criteria
- [ ] Users can see syntax-highlighted code in diff view matching their VS Code theme
- [ ] At least 20 common languages are supported (TypeScript, JavaScript, Python, Go, Rust, Java, C++, etc.)
- [ ] Syntax highlighting does not interfere with existing features (line selection, comments, search)
- [ ] No performance regression - diff rendering completes within same timeframe as before
- [ ] Visual consistency - colors match main editor when viewing same code
