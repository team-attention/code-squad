# Implementation Plan: Thread-Terminal Integration & Per-Thread State

## Overview

This plan implements Phase 2 (Terminal integration with thread creation) and Phase 3 (Per-thread state separation for whitelist/comments) of the Code Squad Multi-Agent View feature.

**Slug**: `sidecar-2025-12-13-thread-terminal-integration`
**Spec**: `docs/specs/sidecar-2025-12-13-thread-terminal-integration.md`
**Size**: LARGE (12 tasks across 2 phases)

## Current State

### Existing (Phase 1 - Complete)

- **ThreadListController**: Thread list management, selection, cycling
- **ThreadTreeDataProvider**: TreeView items with status icons
- **AIDetectionController**: Terminal detection, session creation
- **JsonCommentRepository**: Global comment storage
- **FileWatchController**: Global whitelist from config

### Gaps

| Requirement | Current | Gap |
|-------------|---------|-----|
| Named thread creation | Auto-detect | Manual creation with name |
| Thread-owned terminal | Terminal creates session | Session creates terminal |
| Branch/worktree option | Detected from cwd | User-initiated creation |
| Per-thread whitelist | Global config | Thread-scoped storage |
| Per-thread comments | Global storage | threadId in Comment |
| Thread persistence | In-memory | Storage for metadata |

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Thread creation flow | VSCode QuickPick | Native UX |
| Terminal creation | ITerminalPort.createTerminal() | Extends existing port |
| Git operations | IGitPort extension | Follows existing pattern |
| Thread state storage | `.vscode/sidecar-threads.json` | Consistent with comments |
| Comment threading | Add threadId to Comment | Minimal entity change |

## Task Overview

### Phase 2: Terminal Integration (Tasks 1-7)

| Task | Description | Deps |
|------|-------------|------|
| 1 | Create ThreadState domain entity | - |
| 2 | Create IThreadStateRepository port | 1 |
| 3 | Implement JsonThreadStateRepository | 2 |
| 4 | Extend ITerminalPort with createTerminal | - |
| 5 | Extend IGitPort with branch/worktree | - |
| 6 | Create CreateThreadUseCase | 1-5 |
| 7 | Add "New Agent" button and quick pick | 6 |

### Phase 3: Per-Thread State (Tasks 8-12)

| Task | Description | Deps |
|------|-------------|------|
| 8 | Add threadId to Comment entity | 1 |
| 9 | Update CommentRepository for thread filtering | 8 |
| 10 | Create ManageWhitelistUseCase | 1, 2 |
| 11 | Update FileWatchController for per-thread whitelist | 10 |
| 12 | Update SidecarPanelAdapter for thread context | 8-11 |

## Dependency Graph

```
Task 1 (ThreadState) ──┬──> Task 2 (IThreadStateRepository)
                       │            │
                       │            v
                       │    Task 3 (JsonThreadStateRepository)
                       │            │
                       │            v
Task 4 (ITerminalPort) ──┬──> Task 6 (CreateThreadUseCase)
                         │            │
Task 5 (IGitPort) ───────┘            v
                              Task 7 (New Agent UI)

Task 1 ──> Task 8 (Comment.threadId)
                   │
                   v
           Task 9 (CommentRepository threading)

Task 1, 2 ──> Task 10 (ManageWhitelistUseCase)
                      │
                      v
              Task 11 (FileWatchController update)

Tasks 8-11 ──> Task 12 (Panel update)
```

## Layer Changes

```
src/
├── domain/entities/
│   ├── ThreadState.ts           # Task 1: NEW
│   └── Comment.ts               # Task 8: Add threadId
│
├── application/
│   ├── ports/inbound/
│   │   ├── ICreateThreadUseCase.ts       # Task 6: NEW
│   │   └── IManageWhitelistUseCase.ts    # Task 10: NEW
│   ├── ports/outbound/
│   │   ├── ITerminalPort.ts              # Task 4: Add createTerminal
│   │   ├── IGitPort.ts                   # Task 5: Add branch/worktree
│   │   ├── IThreadStateRepository.ts     # Task 2: NEW
│   │   └── SessionContext.ts             # Task 1: Add threadState
│   └── useCases/
│       ├── CreateThreadUseCase.ts        # Task 6: NEW
│       └── ManageWhitelistUseCase.ts     # Task 10: NEW
│
├── adapters/
│   ├── inbound/controllers/
│   │   ├── ThreadListController.ts       # Task 7: Add createThread()
│   │   └── FileWatchController.ts        # Task 11: Per-thread whitelist
│   ├── inbound/ui/
│   │   ├── ThreadTreeDataProvider.ts     # Task 7: "New Agent" button
│   │   └── SidecarPanelAdapter.ts        # Task 12: Thread context
│   └── outbound/gateways/
│       ├── VscodeTerminalGateway.ts      # Task 4: createTerminal
│       └── VscodeGitGateway.ts           # Task 5: branch/worktree
│
└── infrastructure/repositories/
    └── JsonThreadStateRepository.ts      # Task 3: NEW

package.json                              # Task 7: createAgent command
```

## Validation Checklist

1. `npm run compile` - No errors
2. `npm run lint` - No errors
3. "+" button visible in Threads view title
4. Name input → isolation mode picker → branch name
5. Branch/worktree creation works
6. Terminal opens in correct directory
7. Thread appears with user-defined name
8. Thread-specific whitelist patterns work
9. Comments scoped to current thread
10. Thread switch loads correct state

## Risks

| Risk | Mitigation |
|------|------------|
| Git worktree creation fails | Fallback to branch-only |
| Existing comments orphaned | Backward compatibility |
| Race condition in terminal creation | Lock during registration |
