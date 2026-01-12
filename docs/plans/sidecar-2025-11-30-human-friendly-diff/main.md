# Implementation Plan: Human-Friendly Diff UI

**Slug**: `sidecar-2025-11-30-human-friendly-diff`
**Spec**: `docs/specs/sidecar-2025-11-30-human-friendly-diff.md`
**Size**: MEDIUM (8 tasks)
**Estimated Files**: 12

## Scope Summary

| Phase | Description | Tasks |
|-------|-------------|-------|
| Phase 1 | Bug fixes + cleanup | Task 1-2 |
| Phase 2 | Collapsible chunks with LSP | Task 3-5 |
| Phase 3 | Advanced features | Task 6-8 |

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LSP lookup strategy | Pre-fetch on load | Better UX, no delay on collapse |
| Collapse state storage | Session only | Simpler, resets naturally |
| Scope detection | New `ISymbolPort` | Clean architecture compliance |

## Task Overview

| Task | Description | Files | Dependencies |
|------|-------------|-------|--------------|
| 1 | Rename DiffHunk → DiffChunk | 3 | None |
| 2 | Fix file status detection | 3 | None |
| 3 | Add per-chunk statistics | 2 | Task 1 |
| 4 | Create LSP symbol port | 3 | None |
| 5 | Implement chunk collapse UI | 2 | Task 1, 3, 4 |
| 6 | Add status badge colors | 1 | Task 2 |
| 7 | Implement file tree view | 2 | Task 2 |
| 8 | Add markdown preview mode | 2 | Task 7 |

## Layer Changes

```
src/
├── domain/
│   └── entities/
│       └── Diff.ts                    # Task 1: Rename Hunk→Chunk
│   └── services/
│       └── DiffService.ts             # Task 1,3: Rename + stats
│
├── application/
│   └── ports/
│       └── outbound/
│           ├── ISymbolPort.ts         # Task 4: NEW
│           └── PanelState.ts          # Task 5,7: UI state types
│
├── adapters/
│   ├── inbound/
│   │   ├── controllers/
│   │   │   ├── AIDetectionController.ts    # Task 2: Fix status
│   │   │   └── FileWatchController.ts      # Task 2: Fix status
│   │   └── ui/
│   │       └── SidecarPanelAdapter.ts      # Task 5,6,7,8: UI
│   └── outbound/
│       └── gateways/
│           ├── VscodeGitGateway.ts         # Task 2: getFileStatus
│           └── VscodeLspGateway.ts         # Task 4: NEW
│
└── extension.ts                            # Task 4: Wire LSP gateway
```

## Dependency Graph

```
Task 1 (Rename) ─────┬────► Task 3 (Stats) ─────┐
                     │                          │
                     └──────────────────────────┼────► Task 5 (Collapse UI)
                                                │
Task 4 (LSP Port) ──────────────────────────────┘

Task 2 (File Status) ────► Task 6 (Badges) ────► Task 7 (Tree View) ────► Task 8 (MD Preview)
```

## Execution Order

**Parallel batch 1**: Task 1, Task 2, Task 4 (independent)
**Sequential**: Task 3 → Task 5 (depends on Task 1)
**Sequential**: Task 6 → Task 7 → Task 8 (depends on Task 2)

## Files

- [Task 1: Rename DiffHunk to DiffChunk](./task-1.md)
- [Task 2: Fix File Status Detection](./task-2.md)
- [Task 3: Add Per-Chunk Statistics](./task-3.md)
- [Task 4: Create LSP Symbol Port](./task-4.md)
- [Task 5: Implement Chunk Collapse UI](./task-5.md)
- [Task 6: Add Status Badge Colors](./task-6.md)
- [Task 7: Implement File Tree View](./task-7.md)
- [Task 8: Add Markdown Preview Mode](./task-8.md)

## Validation

After implementation:
1. `npm run compile` - No build errors
2. `npm run lint` - No lint errors
3. Manual test: Open Sidecar, verify file status badges show correct A/M/D
4. Manual test: Collapse/expand chunks, verify scope names display
5. Manual test: File tree groups files by folder
