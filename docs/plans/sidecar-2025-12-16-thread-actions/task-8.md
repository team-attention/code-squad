# Task 8: DeleteThreadUseCase - Orchestrate Thread Cleanup

## Goal

Create DeleteThreadUseCase to handle complete thread deletion with all associated resource cleanup.

## Locations

- Interface: `src/application/ports/inbound/IDeleteThreadUseCase.ts`
- Implementation: `src/application/useCases/DeleteThreadUseCase.ts`
- Test: `src/test/application/useCases/DeleteThreadUseCase.test.ts`

## Interface

```typescript
// src/application/ports/inbound/IDeleteThreadUseCase.ts
export interface DeleteThreadInput {
  threadId: string;
  workspaceRoot: string;
  closeTerminal?: boolean;    // default: true
  removeWorktree?: boolean;   // default: true for worktree threads
}

export interface DeleteThreadOutput {
  success: boolean;
  deletedThreadId: string;
  deletedCommentsCount: number;
  worktreeRemoved: boolean;
  terminalClosed: boolean;
}

export interface IDeleteThreadUseCase {
  execute(input: DeleteThreadInput): Promise<DeleteThreadOutput>;
}
```

## Implementation

```typescript
// src/application/useCases/DeleteThreadUseCase.ts
export class DeleteThreadUseCase implements IDeleteThreadUseCase {
  constructor(
    private readonly threadStateRepository: IThreadStateRepository,
    private readonly terminalPort: ITerminalPort,
    private readonly gitPort: IGitPort,
    private readonly commentRepository: ICommentRepository,
    private readonly detectStatusUseCase: IDetectThreadStatusUseCase
  ) {}

  async execute(input: DeleteThreadInput): Promise<DeleteThreadOutput> {
    const { threadId, workspaceRoot, closeTerminal = true, removeWorktree = true } = input;

    // 1. Find thread state
    const threadState = await this.threadStateRepository.findById(threadId);
    if (!threadState) {
      return {
        success: false,
        deletedThreadId: threadId,
        deletedCommentsCount: 0,
        worktreeRemoved: false,
        terminalClosed: false
      };
    }

    let terminalClosed = false;
    let worktreeRemoved = false;
    let deletedCommentsCount = 0;

    // 2. Close terminal if requested
    if (closeTerminal && threadState.terminalId) {
      this.terminalPort.closeTerminal(threadState.terminalId);
      terminalClosed = true;
    }

    // 3. Clear status detection state
    this.detectStatusUseCase.clear(threadState.terminalId);

    // 4. Delete thread-scoped comments
    deletedCommentsCount = await this.commentRepository.deleteByThreadId(threadId);

    // 5. Remove worktree if applicable and requested
    if (removeWorktree && threadState.worktreePath) {
      try {
        await this.gitPort.removeWorktree(threadState.worktreePath, workspaceRoot, true);
        worktreeRemoved = true;
      } catch (error) {
        // Log but don't fail - worktree might already be gone
        console.error('Failed to remove worktree:', error);
      }
    }

    // 6. Delete thread state
    await this.threadStateRepository.delete(threadId);

    return {
      success: true,
      deletedThreadId: threadId,
      deletedCommentsCount,
      worktreeRemoved,
      terminalClosed
    };
  }
}
```

## Test Scenarios

### DT1: Delete local thread (no worktree)
- **Given**: Thread exists with isolationMode='none', no worktreePath
- **When**: `execute({ threadId: "t1", workspaceRoot: "/ws" })`
- **Then**: Terminal closed, comments deleted, state removed, worktreeRemoved=false

### DT2: Delete worktree thread
- **Given**: Thread with worktreePath="/ws/.worktrees/t1" exists
- **When**: `execute({ threadId: "t1", workspaceRoot: "/ws" })`
- **Then**: Worktree removed, terminal closed, comments deleted, state removed

### DT3: Delete non-existent thread
- **Given**: Thread with id="invalid" doesn't exist
- **When**: `execute({ threadId: "invalid", workspaceRoot: "/ws" })`
- **Then**: Returns { success: false, ... }

### DT4: Skip terminal close
- **Given**: Thread exists
- **When**: `execute({ threadId: "t1", workspaceRoot: "/ws", closeTerminal: false })`
- **Then**: Terminal NOT closed, other cleanup proceeds

### DT5: Skip worktree removal
- **Given**: Thread with worktree exists
- **When**: `execute({ threadId: "t1", workspaceRoot: "/ws", removeWorktree: false })`
- **Then**: Worktree NOT removed, other cleanup proceeds

### DT6: Worktree removal failure handling
- **Given**: Thread exists, worktree removal throws error
- **When**: `execute({ threadId: "t1", workspaceRoot: "/ws" })`
- **Then**: Cleanup continues despite worktree error, success=true

### DT7: Delete thread with comments
- **Given**: Thread has 5 associated comments
- **When**: `execute({ threadId: "t1", workspaceRoot: "/ws" })`
- **Then**: deletedCommentsCount=5

## Dependencies

- Task 1 (ThreadState entity)
- Task 5 (VscodeTerminalGateway)
- Task 6 (VscodeGitGateway)
- Task 7 (JsonCommentRepository)
