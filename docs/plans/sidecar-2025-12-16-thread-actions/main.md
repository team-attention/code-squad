# Thread Actions - Implementation Plan

## Summary

Add action buttons to each thread in the thread list UI:
1. **Delete threads** - cleanup terminal, worktree, branch, comments, status detection state
2. **Rename threads** - update name across ThreadState, terminal title, status detection
3. **Switch git branches** - for worktree-based threads, with uncommitted changes handling

## Architecture

### Current State

```
src/
├── domain/entities/ThreadState.ts      # Thread entity (immutable except whitelistPatterns)
├── application/
│   ├── ports/inbound/ICreateThreadUseCase.ts
│   ├── ports/outbound/
│   │   ├── IThreadStateRepository.ts   # Has delete method
│   │   ├── ITerminalPort.ts            # Has createTerminal, showTerminal, sendText
│   │   ├── ICommentRepository.ts       # Has findByThreadId (no deleteByThreadId)
│   │   └── IGitPort.ts                 # Has createWorktree (no removeWorktree/switchBranch)
│   └── useCases/CreateThreadUseCase.ts
├── adapters/
│   ├── inbound/controllers/ThreadListController.ts
│   ├── inbound/ui/ThreadListWebviewProvider.ts
│   └── outbound/gateways/
│       ├── VscodeTerminalGateway.ts
│       └── VscodeGitGateway.ts
└── extension.ts
```

### Changes Required

**Domain Layer:**
- ThreadState: Add `withName()` and `withBranch()` immutable update methods

**Application Layer - Ports:**
- ITerminalPort: Add `closeTerminal()`, `updateTerminalName()`
- IGitPort: Add `removeWorktree()`, `switchBranch()`, `listBranches()`, `hasUncommittedChanges()`, `stashChanges()`
- ICommentRepository: Add `deleteByThreadId()`

**Application Layer - Use Cases:**
- DeleteThreadUseCase - orchestrate cleanup
- RenameThreadUseCase - update name across components
- SwitchThreadBranchUseCase - branch switching with stash

**Adapter Layer:**
- VscodeTerminalGateway: Implement new port methods
- VscodeGitGateway: Implement worktree/branch methods
- JsonCommentRepository: Implement `deleteByThreadId()`
- ThreadListController: Add action handlers
- ThreadListWebviewProvider: UI buttons and message handlers

## Task List

| # | Task | Dependencies | Status |
|---|------|--------------|--------|
| 1 | ThreadState entity - add `withName()` and `withBranch()` | None | pending |
| 2 | ITerminalPort - add `closeTerminal()`, `updateTerminalName()` | None | pending |
| 3 | IGitPort - add worktree/branch management methods | None | pending |
| 4 | ICommentRepository - add `deleteByThreadId()` | None | pending |
| 5 | VscodeTerminalGateway - implement new port methods | 2 | pending |
| 6 | VscodeGitGateway - implement worktree/branch methods | 3 | pending |
| 7 | JsonCommentRepository - implement `deleteByThreadId()` | 4 | pending |
| 8 | DeleteThreadUseCase - orchestrate cleanup | 1-7 | pending |
| 9 | RenameThreadUseCase - update name across components | 1, 5 | pending |
| 10 | SwitchThreadBranchUseCase - branch switching with stash | 6 | pending |
| 11 | ThreadListController - add action handlers | 8-10 | pending |
| 12 | ThreadListWebviewProvider - UI buttons and messages | 11 | pending |
| 13 | DI Wiring - wire use cases in extension.ts | 8-11 | pending |

## Dependency Graph

```
Tasks 1-4 (Interfaces) - parallel
    │
    ├── Task 5 (TerminalGateway) ─┐
    ├── Task 6 (GitGateway) ─────┼── parallel
    └── Task 7 (CommentRepo) ────┘
            │
            ├── Task 8 (DeleteThreadUseCase) ──┐
            ├── Task 9 (RenameThreadUseCase) ──┼── parallel
            └── Task 10 (SwitchBranchUseCase) ─┘
                    │
                    └── Task 11 (Controller) → Task 12 (UI) → Task 13 (DI)
```

## Files Summary

### New Files (9)

| File | Layer |
|------|-------|
| `src/application/ports/inbound/IDeleteThreadUseCase.ts` | Application |
| `src/application/ports/inbound/IRenameThreadUseCase.ts` | Application |
| `src/application/ports/inbound/ISwitchThreadBranchUseCase.ts` | Application |
| `src/application/useCases/DeleteThreadUseCase.ts` | Application |
| `src/application/useCases/RenameThreadUseCase.ts` | Application |
| `src/application/useCases/SwitchThreadBranchUseCase.ts` | Application |
| `src/test/application/useCases/DeleteThreadUseCase.test.ts` | Test |
| `src/test/application/useCases/RenameThreadUseCase.test.ts` | Test |
| `src/test/application/useCases/SwitchThreadBranchUseCase.test.ts` | Test |

### Modified Files (9)

| File | Changes |
|------|---------|
| `src/domain/entities/ThreadState.ts` | Add `withName()`, `withBranch()` |
| `src/application/ports/outbound/ITerminalPort.ts` | Add `closeTerminal()`, `updateTerminalName()` |
| `src/application/ports/outbound/IGitPort.ts` | Add worktree/branch methods |
| `src/application/ports/outbound/ICommentRepository.ts` | Add `deleteByThreadId()` |
| `src/adapters/outbound/gateways/VscodeTerminalGateway.ts` | Implement new methods |
| `src/adapters/outbound/gateways/VscodeGitGateway.ts` | Implement new methods |
| `src/infrastructure/repositories/JsonCommentRepository.ts` | Implement `deleteByThreadId()` |
| `src/adapters/inbound/controllers/ThreadListController.ts` | Add action handlers |
| `src/adapters/inbound/ui/ThreadListWebviewProvider.ts` | Add UI buttons, message handlers |
| `src/extension.ts` | Wire up new use cases |

## Risk Considerations

1. **Terminal Rename Limitation**: VSCode Terminal API doesn't support renaming. Accept limitation - update internal display name only.

2. **Worktree Removal Safety**: `git worktree remove` fails if uncommitted changes. Add `force` option, default to safe mode.

3. **Branch Deletion**: Risky (data loss). Initially omit branch deletion; only remove worktree.

4. **Session Cleanup**: AIDetectionController holds session state. Need coordination method.
