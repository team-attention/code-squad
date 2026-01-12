# Spec: Human-Friendly Diff UI

**Slug**: `sidecar-2025-11-30-human-friendly-diff`
**Status**: Draft
**Created**: 2025-11-30

## Problem Statement

Sidecar's diff display causes **information overload**. Users cannot quickly scan changes because:
1. All diff chunks are displayed in a flat, unexpandable list
2. File status bug: all files show as "Modified" regardless of actual state
3. No hierarchical structure for changed files

## Requirements

### Phase 1: Bug Fixes + Cleanup

#### R1.1: Fix File Status Bug
- Detect actual file status: `added`, `modified`, `deleted`
- Update `AIDetectionController.ts` baseline file status logic
- Update `FileWatchController.ts` session file status logic

#### R1.2: Rename Hunk to Chunk
- Rename `DiffHunk` to `DiffChunk` in domain entities
- Update all related variable/type names in `DiffService.ts`
- User-facing terminology: "Chunk" instead of "Hunk"

#### R1.3: Status Badge Colors
- `A` (Added): Green badge
- `M` (Modified): Yellow/Orange badge
- `D` (Deleted): Red badge

### Phase 2: Collapsible Chunks

#### R2.1: Chunk Collapse/Expand
- Each diff chunk can be collapsed/expanded independently
- Default state: all expanded
- Persist collapse state per file during session

#### R2.2: Scope Name Display (LSP)
- When collapsed, show enclosing scope name: `ClassName.methodName()`
- Use VSCode LSP `DocumentSymbol` API for scope detection
- Fallback: show line range `Lines 42-58` if no symbol found

#### R2.3: Change Statistics
- Show `[+N, -M]` additions/deletions per chunk when collapsed

### Phase 3: Advanced Features

#### R3.1: File Tree View
- Display changed files in folder hierarchy instead of flat list
- Folder collapse/expand support
- Default state: all folders expanded

#### R3.2: Markdown Preview Mode
- Render markdown files as preview by default
- Toggle button to switch between preview and diff view
- Inline comments on preview mode (comment markers embedded in rendered content)

## Success Criteria

1. File status badges accurately reflect added/modified/deleted state
2. Users can collapse chunks to reduce visual noise
3. Collapsed chunks show meaningful scope context via LSP
4. Changed files are organized by folder structure

## Technical Notes

### Layers Affected

| Layer | Changes |
|-------|---------|
| Domain | `DiffHunk` → `DiffChunk` rename |
| Application | Scope detection service (new) |
| Adapters/Inbound | UI rendering, file tree, collapse state |
| Adapters/Outbound | LSP Gateway (new) |

### LSP Integration

```typescript
// Use VSCode's built-in LSP
const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
  'vscode.executeDocumentSymbolProvider',
  uri
);
```

### Architecture Compliance

- Domain layer: Pure diff/chunk entities (no vscode imports)
- Application layer: `ISymbolPort` interface for LSP abstraction
- Adapters: `VscodeLspGateway` implements `ISymbolPort`

## Out of Scope

- AI-powered diff summarization
- Cross-file change grouping
- Minimap visualization (future consideration)

## References

- Brainstorm: `docs/brainstorms/sidecar-2025-11-30-human-friendly-diff.md`
- Architecture: `docs/rules/CLEAN_ARCHITECTURE.md`
