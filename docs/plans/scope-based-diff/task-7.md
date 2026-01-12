# Task 7: Add Scoped Diff CSS Styles

**Layer**: Adapter (UI/Webview)
**Dependencies**: None

## Goal

Add CSS styles for the scoped diff view, including scope headers, nesting indicators, collapse controls, and change highlights.

## Files to Modify

| File | Action |
|------|--------|
| `src/adapters/inbound/ui/webview/styles.ts` | MODIFY - Add styles |

## Implementation

Add the following CSS to the styles:

```css
/* ============================================
   Scoped Diff Styles
   ============================================ */

.scope-tree {
    font-family: var(--vscode-editor-font-family);
    font-size: var(--vscode-editor-font-size);
}

/* Scope Node Container */
.scope-node {
    margin-left: 0;
}

.scope-node[data-depth="1"] { margin-left: 16px; }
.scope-node[data-depth="2"] { margin-left: 32px; }
.scope-node[data-depth="3"] { margin-left: 48px; }
.scope-node[data-depth="4"] { margin-left: 64px; }

/* Scope Header */
.scope-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--vscode-editor-background);
    border-bottom: 1px solid var(--vscode-panel-border);
    cursor: pointer;
    user-select: none;
    transition: background-color 0.1s;
}

.scope-header:hover {
    background: var(--vscode-list-hoverBackground);
}

.scope-header.has-changes {
    background: color-mix(in srgb, var(--vscode-diffEditor-insertedLineBackground) 30%, transparent);
    border-left: 3px solid var(--vscode-gitDecoration-addedResourceForeground);
    padding-left: 9px;
}

.scope-header.no-collapse {
    cursor: default;
}

/* Toggle Arrow */
.scope-toggle {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: var(--vscode-foreground);
    opacity: 0.7;
    transition: transform 0.15s ease;
}

.scope-toggle.collapsed {
    transform: rotate(-90deg);
}

.scope-header.no-collapse .scope-toggle {
    opacity: 0.3;
}

/* Scope Icon */
.scope-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
}

.scope-icon.function { color: var(--vscode-symbolIcon-functionForeground, #b180d7); }
.scope-icon.method { color: var(--vscode-symbolIcon-methodForeground, #b180d7); }
.scope-icon.class { color: var(--vscode-symbolIcon-classForeground, #ee9d28); }
.scope-icon.interface { color: var(--vscode-symbolIcon-interfaceForeground, #75beff); }
.scope-icon.constructor { color: var(--vscode-symbolIcon-constructorForeground, #b180d7); }
.scope-icon.enum { color: var(--vscode-symbolIcon-enumeratorForeground, #ee9d28); }
.scope-icon.module { color: var(--vscode-symbolIcon-moduleForeground, #ee9d28); }
.scope-icon.namespace { color: var(--vscode-symbolIcon-namespaceForeground, #ee9d28); }

/* Scope Name */
.scope-name {
    flex: 1;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Scope Kind Badge */
.scope-kind {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
    padding: 1px 4px;
    background: var(--vscode-badge-background);
    border-radius: 3px;
    opacity: 0.7;
}

/* Scope Stats */
.scope-stats {
    font-size: 11px;
    font-family: var(--vscode-editor-font-family);
    display: flex;
    gap: 6px;
}

.scope-stats .added {
    color: var(--vscode-gitDecoration-addedResourceForeground);
}

.scope-stats .removed {
    color: var(--vscode-gitDecoration-deletedResourceForeground);
}

.scope-stats .no-changes {
    color: var(--vscode-descriptionForeground);
    opacity: 0.6;
}

/* Scope Content */
.scope-content {
    overflow: hidden;
    border-left: 1px solid var(--vscode-panel-border);
    margin-left: 7px;
}

.scope-content.collapsed {
    display: none;
}

/* Scope Lines */
.scope-lines {
    margin: 0;
}

/* Nested scopes separator */
.scope-node + .scope-node {
    border-top: 1px solid var(--vscode-panel-border);
}

/* ============================================
   Orphan Lines Section
   ============================================ */

.orphan-lines {
    border-top: 1px dashed var(--vscode-panel-border);
    padding-top: 8px;
    margin-top: 16px;
}

.orphan-lines-header {
    color: var(--vscode-descriptionForeground);
    font-size: 11px;
    padding: 4px 12px;
    font-style: italic;
}

/* ============================================
   Expand/Collapse All Buttons
   ============================================ */

.scope-controls {
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--vscode-panel-border);
    background: var(--vscode-editor-background);
}

.scope-control-btn {
    font-size: 11px;
    padding: 3px 8px;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: none;
    border-radius: 3px;
    cursor: pointer;
    transition: background-color 0.1s;
}

.scope-control-btn:hover {
    background: var(--vscode-button-secondaryHoverBackground);
}

/* ============================================
   Fallback Message
   ============================================ */

.scope-fallback-message {
    padding: 12px;
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
    font-style: italic;
    text-align: center;
    border-bottom: 1px solid var(--vscode-panel-border);
}
```

## Validation

```bash
npm run compile
npm run lint
```

## Design Notes

- Uses VSCode theme variables for consistency
- Nesting indicated by left margin
- Changed scopes have green left border
- Smooth collapse/expand animation via CSS transform
- Responsive to light/dark themes
- Maintains accessibility with sufficient contrast
