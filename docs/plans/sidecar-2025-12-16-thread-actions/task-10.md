# Task 10: SwitchThreadBranchUseCase - Switch Branch in Worktree

## Goal

Create SwitchThreadBranchUseCase to switch git branch in worktree-based threads, handling uncommitted changes.

## Locations

- Interface: `src/application/ports/inbound/ISwitchThreadBranchUseCase.ts`
- Implementation: `src/application/useCases/SwitchThreadBranchUseCase.ts`
- Test: `src/test/application/useCases/SwitchThreadBranchUseCase.test.ts`

## Interface

```typescript
// src/application/ports/inbound/ISwitchThreadBranchUseCase.ts
export interface SwitchThreadBranchInput {
  threadId: string;
  targetBranch: string;
  stashChanges?: boolean;  // default: true
}

export interface SwitchThreadBranchOutput {
  success: boolean;
  threadState: ThreadState | null;
  previousBranch: string | null;
  changesStashed: boolean;
}

export interface ISwitchThreadBranchUseCase {
  execute(input: SwitchThreadBranchInput): Promise<SwitchThreadBranchOutput>;
}
```

## Implementation

```typescript
// src/application/useCases/SwitchThreadBranchUseCase.ts
export class SwitchThreadBranchUseCase implements ISwitchThreadBranchUseCase {
  constructor(
    private readonly threadStateRepository: IThreadStateRepository,
    private readonly gitPort: IGitPort
  ) {}

  async execute(input: SwitchThreadBranchInput): Promise<SwitchThreadBranchOutput> {
    const { threadId, targetBranch, stashChanges = true } = input;

    // 1. Find thread state
    const threadState = await this.threadStateRepository.findById(threadId);
    if (!threadState) {
      return {
        success: false,
        threadState: null,
        previousBranch: null,
        changesStashed: false
      };
    }

    // 2. Verify this is a worktree thread
    if (!threadState.worktreePath) {
      throw new Error('Cannot switch branch: thread does not have a worktree');
    }

    const previousBranch = threadState.branch;
    let changesStashed = false;

    // 3. Check for uncommitted changes
    const hasChanges = await this.gitPort.hasUncommittedChanges(threadState.worktreePath);

    if (hasChanges) {
      if (stashChanges) {
        await this.gitPort.stashChanges(threadState.worktreePath);
        changesStashed = true;
      } else {
        throw new Error('Cannot switch branch: uncommitted changes exist. Set stashChanges=true to auto-stash.');
      }
    }

    // 4. Switch branch
    await this.gitPort.switchBranch(threadState.worktreePath, targetBranch);

    // 5. Update thread state with new branch
    const updatedState = threadState.withBranch(targetBranch);
    await this.threadStateRepository.save(updatedState);

    return {
      success: true,
      threadState: updatedState,
      previousBranch,
      changesStashed
    };
  }
}
```

## Test Scenarios

### SB1: Switch branch with clean state
- **Given**: Worktree thread on "main", no uncommitted changes
- **When**: `execute({ threadId: "t1", targetBranch: "feature/x" })`
- **Then**: Branch switched, state updated, changesStashed=false

### SB2: Switch branch with uncommitted changes (stash=true)
- **Given**: Worktree thread with uncommitted changes
- **When**: `execute({ threadId: "t1", targetBranch: "feature/x", stashChanges: true })`
- **Then**: Changes stashed, branch switched, changesStashed=true

### SB3: Switch branch with uncommitted changes (stash=false)
- **Given**: Worktree thread with uncommitted changes
- **When**: `execute({ threadId: "t1", targetBranch: "feature/x", stashChanges: false })`
- **Then**: Error thrown about uncommitted changes

### SB4: Switch branch non-worktree thread
- **Given**: Thread with isolationMode='none' (no worktreePath)
- **When**: `execute({ threadId: "t1", targetBranch: "feature/x" })`
- **Then**: Error thrown: "thread does not have a worktree"

### SB5: Switch to non-existent branch
- **Given**: Worktree thread, branch "nonexistent" doesn't exist
- **When**: `execute({ threadId: "t1", targetBranch: "nonexistent" })`
- **Then**: Git error propagated

### SB6: Non-existent thread
- **Given**: Thread doesn't exist
- **When**: `execute({ threadId: "invalid", targetBranch: "main" })`
- **Then**: Returns { success: false, threadState: null }

### SB7: Previous branch returned
- **Given**: Thread on branch "old-branch"
- **When**: `execute({ threadId: "t1", targetBranch: "new-branch" })`
- **Then**: previousBranch="old-branch" in output

## Dependencies

- Task 1 (ThreadState.withBranch)
- Task 6 (VscodeGitGateway branch/stash methods)
