# Changes: Attach to Existing Git Worktree

## Summary

Implemented the ability to attach Code Squad to an existing git worktree that was created outside of the extension. Users can now click "Attach to Worktree" button in the sidebar, select an unattached worktree from a Quick Pick list, and create a new thread for it.

## Changes Made

### Application Layer

#### New: `IAttachToWorktreeUseCase` Interface
- `src/application/ports/inbound/IAttachToWorktreeUseCase.ts`
- Defines `AttachToWorktreeInput`, `AttachToWorktreeOutput`, and `IAttachToWorktreeUseCase` interface

#### New: `AttachToWorktreeUseCase` Implementation
- `src/application/useCases/AttachToWorktreeUseCase.ts`
- Validates worktree path, gets branch name, creates terminal, creates and persists ThreadState

#### Extended: `IGitPort` Interface
- `src/application/ports/outbound/IGitPort.ts`
- Added `WorktreeInfo` interface
- Added `listWorktrees()` - lists all worktrees (excluding main repo)
- Added `isValidWorktree()` - validates a path is a valid git worktree
- Added `getWorktreeBranch()` - gets branch name for a worktree

### Adapters Layer

#### Extended: `VscodeGitGateway`
- `src/adapters/outbound/gateways/VscodeGitGateway.ts`
- Implemented `listWorktrees()` - parses `git worktree list --porcelain`
- Implemented `isValidWorktree()` - checks path exists, is git repo, and in worktree list
- Implemented `getWorktreeBranch()` - runs `git rev-parse --abbrev-ref HEAD`

#### Extended: `ThreadListController`
- `src/adapters/inbound/controllers/ThreadListController.ts`
- Added `attachToWorktreeUseCase` constructor parameter
- Added `attachToWorktree()` method with Quick Pick and Input Box flow

#### Extended: `ThreadListWebviewProvider`
- `src/adapters/inbound/ui/ThreadListWebviewProvider.ts`
- Added `onAttachToWorktree` callback to constructor
- Added "Attach to Worktree" button with secondary styling
- Added message handler for `attachToWorktree` message type

### Entry Point

#### Extended: `extension.ts`
- `src/extension.ts`
- Imported and instantiated `AttachToWorktreeUseCase`
- Passed use case to `ThreadListController` constructor

### Tests

#### Updated Mock Classes
- `src/test/application/useCases/CreateThreadUseCase.test.ts`
- `src/test/application/useCases/GenerateDiffUseCase.test.ts`
- Added mock implementations for new IGitPort methods

## Files Changed

| File | Change Type |
|------|-------------|
| `src/application/ports/outbound/IGitPort.ts` | Modified |
| `src/application/ports/inbound/IAttachToWorktreeUseCase.ts` | Created |
| `src/application/useCases/AttachToWorktreeUseCase.ts` | Created |
| `src/adapters/outbound/gateways/VscodeGitGateway.ts` | Modified |
| `src/adapters/inbound/controllers/ThreadListController.ts` | Modified |
| `src/adapters/inbound/ui/ThreadListWebviewProvider.ts` | Modified |
| `src/extension.ts` | Modified |
| `src/test/application/useCases/CreateThreadUseCase.test.ts` | Modified |
| `src/test/application/useCases/GenerateDiffUseCase.test.ts` | Modified |

## Validation

- TypeScript compilation: Pass
- ESLint: Pass (only pre-existing warnings)
- Type checking: Pass
