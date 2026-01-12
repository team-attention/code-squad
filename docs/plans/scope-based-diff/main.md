# Implementation Plan: Scope-Based Diff

**Slug**: `scope-based-diff`
**Spec**: `docs/specs/sidecar-2025-12-06-scope-based-diff.md`
**Size**: LARGE (8 tasks)

## Summary

Add scope-based collapsible diff view that displays code changes within their structural context (methods, functions, classes). Changed scopes are expanded by default while unchanged scopes are collapsed.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope extraction | `ISymbolPort` + `VscodeLspGateway` | Reuse existing LSP infrastructure |
| Diff-to-scope mapping | Domain service `ScopeMappingService` | Pure business logic, testable without VSCode |
| Scope tree structure | New domain entity `ScopedDiff` | Represents hierarchical scoped diff view |
| Collapse state | Application layer `PanelStateManager` | Already manages UI state |
| Rendering mode | New diff view mode in webview | Parallel to existing chunk-based rendering |
| Fallback | Automatic to chunk-based | When LSP unavailable or returns empty symbols |

## Task Overview

| Task | Description | Layer | Dependencies |
|------|-------------|-------|--------------|
| 1 | Create Scope domain entity | Domain | None |
| 2 | Create ScopeMappingService | Domain | Task 1 |
| 3 | Create GenerateScopedDiffUseCase | Application | Task 2 |
| 4 | Extend PanelState for scoped diff | Application | None |
| 5 | Extend ISymbolPort for full file symbols | Application + Adapter | None |
| 6 | Integrate scoped diff in SidecarPanelAdapter | Adapter | Tasks 3, 4, 5 |
| 7 | Add scoped diff CSS styles | Adapter/Webview | None |
| 8 | Implement scoped diff rendering in webview | Adapter/Webview | Tasks 6, 7 |

## Dependency Graph

```
Task 1 (Scope entity)
    │
    ▼
Task 2 (ScopeMappingService)
    │
    ▼
Task 3 (GenerateScopedDiffUseCase) ◄── Task 4 (PanelState)
    │                                       │
    ▼                                       ▼
Task 5 (ISymbolPort extend) ──────────► Task 6 (SidecarPanelAdapter)
                                            │
Task 7 (CSS) ─────────────────────────► Task 8 (Webview rendering)
```

## Execution Order

**Parallel batch 1**: Task 1, Task 4, Task 5, Task 7 (independent)
**Sequential after batch 1**: Task 2 (depends on Task 1)
**Sequential after Task 2**: Task 3 (depends on Task 2)
**Sequential after Tasks 3, 4, 5**: Task 6 (depends on 3, 4, 5)
**Sequential after Tasks 6, 7**: Task 8 (depends on 6, 7)

## Layer Changes

```
src/
├── domain/
│   ├── entities/
│   │   ├── Scope.ts                    # Task 1: NEW
│   │   └── ScopedDiff.ts               # Task 1: NEW
│   └── services/
│       └── ScopeMappingService.ts      # Task 2: NEW
│
├── application/
│   ├── ports/
│   │   ├── inbound/
│   │   │   └── IGenerateScopedDiffUseCase.ts  # Task 3: NEW
│   │   └── outbound/
│   │       ├── ISymbolPort.ts          # Task 5: Extend
│   │       └── PanelState.ts           # Task 4: Extend
│   └── useCases/
│       └── GenerateScopedDiffUseCase.ts  # Task 3: NEW
│
├── adapters/
│   ├── inbound/
│   │   └── ui/
│   │       ├── SidecarPanelAdapter.ts  # Task 6: Extend
│   │       └── webview/
│   │           ├── script.ts           # Task 8: Add scoped diff rendering
│   │           └── styles.ts           # Task 7: Add scoped diff CSS
│   └── outbound/
│       └── gateways/
│           └── VscodeLspGateway.ts     # Task 5: Extend
```

## Data Flow

```
Extension                              Webview
┌─────────────────────┐               ┌──────────────────────────────┐
│ SidecarPanelAdapter │               │ renderScopedDiff()           │
│                     │               │                              │
│ 1. generateDiff     │               │ - Receive ScopedDiffDisplay  │
│ 2. getScopesForFile │──postMessage──│ - Render scope tree          │
│ 3. mapDiffToScopes  │               │ - Apply collapse state       │
│ 4. create display   │               │ - Handle expand/collapse     │
│    state            │               │                              │
└─────────────────────┘               └──────────────────────────────┘
```

## Validation

After implementation:
1. `npm run compile` - No build errors
2. `npm run lint` - No lint errors
3. `npm run test` - All tests pass
4. Manual: Scope-based view shows for TypeScript/JavaScript files
5. Manual: Changed scopes expanded, unchanged collapsed by default
6. Manual: "Expand All" / "Collapse All" works correctly
7. Manual: Comment navigation expands containing scope
8. Manual: Fallback to chunk-based view for unsupported files
9. Performance: <200ms for typical files

## Task Files

- [Task 1: Create Scope Domain Entity](./task-1.md)
- [Task 2: Create ScopeMappingService](./task-2.md)
- [Task 3: Create GenerateScopedDiffUseCase](./task-3.md)
- [Task 4: Extend PanelState for Scoped Diff](./task-4.md)
- [Task 5: Extend ISymbolPort for Full File Symbols](./task-5.md)
- [Task 6: Integrate Scoped Diff in SidecarPanelAdapter](./task-6.md)
- [Task 7: Add Scoped Diff CSS Styles](./task-7.md)
- [Task 8: Implement Scoped Diff Rendering in Webview](./task-8.md)
