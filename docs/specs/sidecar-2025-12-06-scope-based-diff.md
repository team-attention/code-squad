# Spec: Scope-Based Diff

**Slug**: `sidecar-2025-12-06-scope-based-diff`
**Created**: 2025-12-06
**Status**: Draft

## Summary

Add scope-based collapsible diff view that displays code changes within their structural context (methods, functions, classes). Changed scopes are expanded by default while unchanged scopes are collapsed, reducing visual noise while preserving structural awareness.

## Background

### Current State

The existing unified diff view displays changes in chunks, showing only the modified lines plus surrounding context (typically 3 lines before/after). While this is sufficient for seeing "what changed," it lacks structural context that helps developers understand "where the change occurred" within the file's architecture.

### Problem

During spec-driven development with AI coding assistants, developers experience cognitive friction when reviewing code changes:

1. **Context Gap**: Diff chunks show code fragments without class/method names, requiring manual mental reconstruction of code structure
2. **Abstraction Jump**: Specifications are written in natural language (high-level intent), but diffs show low-level code changes without intermediate structural mapping
3. **Navigation Difficulty**: Large files require scrolling through many chunks to understand which methods/functions were modified

This creates a cognitive disconnect between "what the spec asked for" and "what code actually changed," making code review slower and more error-prone.

### User Scenario

A developer reviews AI-generated code implementing a spec that says "Add error handling to user authentication methods." The current diff shows:

```
@@ -45,3 +45,5 @@
     const user = await db.findUser(id);
+    if (!user) {
+      throw new NotFoundError(id);
     return user;
```

The developer must mentally answer: "Which method is this? Is this in the login flow or the registration flow? What class does this belong to?"

With scope-based diff, the same change shows:

```
▼ UserAuthService.ts                     [+8 -3]
  ├─ ▶ constructor()                     [no changes]
  ├─ ▼ getUserById()                     [+3 -1]
  │     45 │ const user = await db.findUser(id);
  │     46 │+if (!user) {
  │     47 │+  throw new NotFoundError(id);
  │     48 │ return user;
  └─ ▶ validateCredentials()             [no changes]
```

The structural context immediately answers "where" without requiring mental effort.

## Requirements

### Functional

1. **Scope Hierarchy Display**
   - Display file structure as a collapsible tree (class → method → nested function)
   - Show scope names (function/method/class names) with modification indicators
   - Support nesting levels appropriate to language structure (e.g., class.method in OOP, module.function in procedural)

2. **Collapse/Expand Controls**
   - Individual scopes can be collapsed or expanded via UI controls (click to toggle)
   - Unchanged scopes are collapsed by default
   - Changed scopes (containing added/removed/modified lines) are expanded by default
   - "Expand All" / "Collapse All" buttons for entire file

3. **Change Indicators**
   - Display change summary per scope: `[+N -M]` (lines added/removed)
   - Highlight scope headers of changed scopes to draw attention
   - Preserve existing line-level highlighting (green for additions, red for deletions)

4. **Multi-Language Support**
   - Support all languages that provide Document Symbols via VSCode Language Server Protocol (LSP)
   - Fallback to chunk-based view for files without LSP support
   - Handle language-specific scope types (class, method, function, interface, enum, etc.)

5. **Integration with Existing Features**
   - Comments can still be added to specific lines within scopes
   - Search/filter works across all scopes (both collapsed and expanded)
   - Navigation from sidebar comments works within scope-based view

### Non-Functional

- **Performance**: Scope extraction and rendering should complete in <200ms for typical files (<1000 lines)
- **Usability**: Default collapse/expand state should minimize scrolling for typical reviews (1-3 changed methods in a 500-line file)
- **Consistency**: Visual design should match existing diff styling (color scheme, spacing, typography)
- **Accessibility**: Keyboard navigation for expanding/collapsing scopes

## Use Cases

### UC-1: View Scope-Based Diff

- **Actor**: Developer reviewing AI-generated code changes
- **Trigger**: File is selected in the diff viewer
- **Flow**:
  1. Developer clicks on a changed file in the sidebar file list
  2. System extracts document symbols from file using VSCode LSP DocumentSymbol API
  3. System maps diff hunks to their containing scopes (methods/functions/classes)
  4. System renders scope hierarchy with change indicators
  5. Changed scopes are expanded, unchanged scopes are collapsed
  6. Developer sees structural context alongside code changes
- **Business Rules**:
  - If LSP returns no symbols (unsupported language), fall back to chunk-based view
  - Empty scopes (no code inside) are not displayed
  - Top-level statements (outside any function/class) are grouped under a "Module Scope" or similar label
- **Location**: `application/useCases/GenerateScopedDiffUseCase.ts` (new), `adapters/inbound/ui/SidecarPanelAdapter.ts` (modified)

### UC-2: Expand/Collapse Scope

- **Actor**: Developer reviewing code
- **Trigger**: Developer clicks collapse/expand control on a scope header
- **Flow**:
  1. Developer clicks the expand/collapse icon (▶/▼) next to a scope name
  2. System toggles scope visibility state
  3. If expanding: child lines and nested scopes become visible
  4. If collapsing: child lines and nested scopes are hidden, only scope header remains
  5. UI updates to show new state
- **Business Rules**:
  - **Scopes containing changes cannot be collapsed** - ensures modifications are always visible
  - Expanding a scope does not automatically expand nested scopes (explicit control only)
  - Collapse state is preserved during the current review session
  - Collapse state resets when switching to a different file
- **Location**: `adapters/inbound/ui/SidecarPanelAdapter.ts` (state management), webview `script.ts` (UI interaction)

### UC-3: Expand/Collapse All Scopes

- **Actor**: Developer reviewing code
- **Trigger**: Developer clicks "Expand All" or "Collapse All" button
- **Flow**:
  1. Developer clicks "Expand All" or "Collapse All" button in file diff header
  2. System iterates through all scopes in the file
  3. System sets all scopes to expanded or collapsed state
  4. UI refreshes to show all scopes in the new state
- **Business Rules**:
  - "Expand All" reveals all lines in the file, similar to current chunk-based view
  - "Collapse All" shows only scope headers with change indicators, **except scopes containing changes remain expanded**
  - Action applies only to the current file, not other files in the review
- **Location**: Webview `script.ts` (UI state management)

### UC-4: Navigate to Comment in Scope-Based Diff

- **Actor**: Developer reviewing code
- **Trigger**: Developer clicks a comment in the sidebar
- **Flow**:
  1. Developer clicks a comment in the sidebar comment list
  2. System identifies the file and line number of the comment
  3. System opens the file's diff view in scope-based mode
  4. System identifies which scope contains the commented line
  5. System expands the containing scope (if collapsed)
  6. System scrolls to the commented line and highlights it
- **Business Rules**:
  - If the containing scope is nested (e.g., inner function), all parent scopes are also expanded
  - Comment highlighting takes precedence over default expand/collapse state
  - After navigation, the expanded state persists until manually changed or file is switched
- **Location**: `adapters/inbound/ui/SidecarPanelAdapter.ts` (message handler), webview `script.ts` (scroll + expand logic)

### UC-5: Add Comment in Scope-Based Diff

- **Actor**: Developer reviewing code
- **Trigger**: Developer clicks add comment icon on a line within an expanded scope
- **Flow**:
  1. Developer browses an expanded scope
  2. Developer clicks the comment icon in the gutter next to a code line
  3. System displays inline comment input form below the line
  4. Developer types comment text and submits
  5. System creates comment entity with file, line number, and text
  6. System displays comment marker in gutter and inline comment box
  7. Comment appears in sidebar comment list
- **Business Rules**:
  - Comments can only be added to visible (expanded) lines
  - Comment markers are visible even when scope is collapsed (persistent indicator)
  - Clicking comment marker in collapsed scope expands the scope and shows the comment
- **Location**: Reuses existing `AddCommentUseCase.ts`, webview `script.ts` (scope-aware UI rendering)

## Technical Approach

### LSP-Based Scope Extraction

Use VSCode's Document Symbol Provider API to extract scope information:

```typescript
const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
  'vscode.executeDocumentSymbolProvider',
  fileUri
);
```

Each `DocumentSymbol` provides:
- `name`: Method/function/class name
- `kind`: Symbol type (Method, Function, Class, etc.)
- `range`: Full extent of the symbol (including body)
- `selectionRange`: Name identifier location
- `children`: Nested symbols

### Diff Mapping Algorithm

1. Parse unified diff into hunks (lines with additions/deletions/context)
2. Extract DocumentSymbols from file
3. For each hunk, find the innermost symbol that contains the hunk's line range
4. Group hunks by their containing symbol
5. Build tree structure matching symbol hierarchy
6. Calculate change counts (+N -M) per symbol
7. Mark symbols as "changed" if they contain any hunk

### Rendering Strategy

Render as nested HTML with collapse/expand controls:

```html
<div class="scope-tree">
  <div class="scope-node" data-scope-id="symbol-1">
    <button class="scope-toggle">▼</button>
    <span class="scope-name">UserService.getUserById()</span>
    <span class="scope-changes">[+3 -1]</span>
    <div class="scope-content">
      <!-- diff lines here -->
    </div>
  </div>
</div>
```

Collapsing hides `.scope-content`, toggling icon between ▶ and ▼.

### Fallback Behavior

If DocumentSymbol API returns empty or fails (unsupported language, parse error):
- Render traditional chunk-based diff
- Display informational message: "Scope view unavailable for this file"
- Preserve all other features (comments, search, navigation)

## Out of Scope

- Semantic highlighting within scopes (covered by separate syntax highlighting feature)
- Custom scope collapse rules based on file patterns or user preferences
- Scope-level comments (comments remain line-based)
- Diff editing or inline merge conflict resolution
- Real-time scope updates while file is being edited (scope structure is snapshot-based)
- Symbol filtering/search (e.g., "show only changed methods") - potential future enhancement

## Open Questions

1. **Scope Granularity**: Should we collapse at class level or method level by default?
   - **Tentative Decision**: Method/function level for most languages. For files with many small methods, consider class-level collapse as an option.

2. **Anonymous Functions**: How to label anonymous functions or lambda expressions?
   - **Tentative Decision**: Use LSP-provided name if available (e.g., "arrow function at line 42"), otherwise show line number as identifier.

3. **Top-Level Code**: How to group code outside of any function/class?
   - **Tentative Decision**: Group under "Module Scope" or "File-Level Code" label. If changes are minimal, leave expanded by default.

4. **Performance for Large Files**: What is acceptable performance for files with 100+ scopes?
   - **Success Metric**: <500ms for 100 scopes, <1s for 200 scopes. Beyond this, consider progressive rendering or pagination.

5. **Nested Scope Collapse**: When collapsing a parent scope, should all child scopes also collapse?
   - **Tentative Decision**: Collapsing is hierarchical, but **scopes containing changes cannot be collapsed**. If a parent scope is collapsed, any child scope with changes remains visible (expanded). This ensures users never lose sight of modifications.

## Success Criteria

- [ ] Changed methods/functions are visible by default while unchanged ones are hidden
- [ ] Developers can identify which class/method/function was modified without scrolling or manual searching
- [ ] Scope extraction works for at least TypeScript, JavaScript, Python, Go, Rust, Java, C++
- [ ] Performance meets <200ms target for typical files
- [ ] Existing features (comments, navigation, search) work correctly in scope-based view
- [ ] Visual design is consistent with current diff styling
- [ ] Fallback to chunk-based view is graceful and informative for unsupported files

## References

- Brainstorm: `/Users/eatnug/Workspace/sidecar/docs/brainstorms/scope-based-diff.md`
- VSCode DocumentSymbol API: https://code.visualstudio.com/api/references/vscode-api#DocumentSymbol
- Related features: Comment Management, Diff Syntax Highlighting
