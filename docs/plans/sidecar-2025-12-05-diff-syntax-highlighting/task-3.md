# Task 3: Add Token CSS Styles

**Layer**: Adapter (UI/Webview)
**Dependencies**: None

## Goal

Add CSS styles that map Shiki token types to VS Code theme colors, ensuring syntax highlighting looks consistent with the editor.

## Files to Modify

| File | Changes |
|------|---------|
| `src/adapters/inbound/ui/webview/styles.ts` | Add token color CSS rules |

## Implementation Steps

### Step 1: Add Shiki Token Styles

Shiki outputs HTML with inline styles by default, but with the theme, it generates spans with specific color values. We need to ensure these colors work with both light and dark VS Code themes.

Add to `styles.ts`:

```css
/* Syntax Highlighting Token Styles */
/* These override Shiki's inline styles with VS Code theme variables */

.diff-content .shiki {
    background: transparent !important;
}

.diff-content .shiki code {
    background: transparent !important;
}

/* Preserve diff line backgrounds while showing syntax colors */
.diff-line.addition .diff-content .shiki span {
    /* Let Shiki colors show on addition background */
}

.diff-line.deletion .diff-content .shiki span {
    /* Slightly dim syntax colors for deleted lines */
    opacity: 0.85;
}

/* Ensure code fits within diff table cells */
.diff-content .shiki {
    display: inline;
    white-space: pre;
}

.diff-content .shiki code {
    display: inline;
}

/* Token type color overrides using VS Code variables */
/* These provide fallbacks if Shiki colors don't match theme */
.diff-content .shiki .keyword {
    color: var(--vscode-debugTokenExpression-keyword, #c586c0);
}

.diff-content .shiki .string {
    color: var(--vscode-debugTokenExpression-string, #ce9178);
}

.diff-content .shiki .number {
    color: var(--vscode-debugTokenExpression-number, #b5cea8);
}

.diff-content .shiki .comment {
    color: var(--vscode-descriptionForeground, #6a9955);
    font-style: italic;
}

.diff-content .shiki .function {
    color: var(--vscode-symbolIcon-functionForeground, #dcdcaa);
}

.diff-content .shiki .variable {
    color: var(--vscode-symbolIcon-variableForeground, #9cdcfe);
}

.diff-content .shiki .type {
    color: var(--vscode-symbolIcon-classForeground, #4ec9b0);
}

.diff-content .shiki .operator {
    color: var(--vscode-foreground, #d4d4d4);
}

.diff-content .shiki .punctuation {
    color: var(--vscode-foreground, #d4d4d4);
}

/* Ensure syntax highlighting doesn't break selection */
.diff-line.selected .diff-content .shiki span {
    /* Selection background overrides syntax background */
}

/* Search match highlighting takes precedence */
.diff-content .search-match {
    background-color: var(--vscode-editor-findMatchHighlightBackground, rgba(234, 92, 0, 0.33)) !important;
}
```

### Step 2: Verify Integration Points

Ensure the styles work with existing diff styling:
- Addition lines (green background)
- Deletion lines (red background)
- Context lines (no background)
- Selected lines (highlight background)
- Search matches (yellow highlight)

## Validation

```bash
npm run compile    # Build succeeds
npm run lint       # No lint errors
```

## Tests

- [ ] Syntax colors visible on addition lines (green bg)
- [ ] Syntax colors visible on deletion lines (red bg)
- [ ] Syntax colors visible on context lines
- [ ] Selection highlighting still works
- [ ] Search highlighting still works
- [ ] Light theme colors look appropriate
- [ ] Dark theme colors look appropriate

## Architecture Compliance

- Adapter layer: UI styling
- No imports from other layers
- CSS-only changes
