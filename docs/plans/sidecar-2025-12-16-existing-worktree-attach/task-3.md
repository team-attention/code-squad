# Task 3: Create AttachToWorktreeUseCase

## Goal

Create a new use case that attaches Code Squad to an existing git worktree by validating it, creating a terminal, and persisting the thread state.

## Locations

- `src/application/ports/inbound/IAttachToWorktreeUseCase.ts` (NEW)
- `src/application/useCases/AttachToWorktreeUseCase.ts` (NEW)

## Changes

### 1. Create IAttachToWorktreeUseCase Interface

Create new file `src/application/ports/inbound/IAttachToWorktreeUseCase.ts`:

```typescript
import { ThreadState } from '../../../domain/entities/ThreadState';

export interface AttachToWorktreeInput {
    worktreePath: string;
    name?: string;  // Optional, defaults to branch name
    workspaceRoot: string;
}

export interface AttachToWorktreeOutput {
    threadState: ThreadState;
}

export interface IAttachToWorktreeUseCase {
    execute(input: AttachToWorktreeInput): Promise<AttachToWorktreeOutput>;
}
```

### 2. Create AttachToWorktreeUseCase Implementation

Create new file `src/application/useCases/AttachToWorktreeUseCase.ts`:

```typescript
import { ThreadState } from '../../domain/entities/ThreadState';
import { IThreadStateRepository } from '../ports/outbound/IThreadStateRepository';
import { ITerminalPort } from '../ports/outbound/ITerminalPort';
import { IGitPort } from '../ports/outbound/IGitPort';
import {
    IAttachToWorktreeUseCase,
    AttachToWorktreeInput,
    AttachToWorktreeOutput,
} from '../ports/inbound/IAttachToWorktreeUseCase';

export class AttachToWorktreeUseCase implements IAttachToWorktreeUseCase {
    constructor(
        private readonly threadStateRepository: IThreadStateRepository,
        private readonly terminalPort: ITerminalPort,
        private readonly gitPort: IGitPort
    ) {}

    async execute(input: AttachToWorktreeInput): Promise<AttachToWorktreeOutput> {
        const { worktreePath, name, workspaceRoot } = input;

        // Step 1: Validate worktree
        const isValid = await this.gitPort.isValidWorktree(worktreePath, workspaceRoot);
        if (!isValid) {
            throw new Error(`Invalid git worktree at ${worktreePath}`);
        }

        // Step 2: Get branch name
        let branch: string;
        try {
            branch = await this.gitPort.getWorktreeBranch(worktreePath);
        } catch (error) {
            throw new Error(`Failed to get branch name: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Step 3: Determine thread name (use provided name or default to branch)
        const threadName = name ?? branch;

        // Step 4: Create terminal in worktree directory
        const terminalId = await this.terminalPort.createTerminal(threadName, worktreePath);

        // Step 5: Create thread state
        const threadState = ThreadState.create({
            name: threadName,
            terminalId,
            workingDir: worktreePath,
            branch,
            worktreePath,
            whitelistPatterns: [],
        });

        // Step 6: Persist thread state
        await this.threadStateRepository.save(threadState);

        return { threadState };
    }
}
```

## Test Scenarios

### TS1: Attach to Valid Worktree

**Given**: Worktree exists at `/path/to/worktree` with branch `feature-x`
**When**: `execute({ worktreePath: '/path/to/worktree', workspaceRoot })` is called
**Then**: `isValidWorktree()` is called to validate path
**And**: `getWorktreeBranch()` is called to get branch name
**And**: Terminal is created with name `feature-x` at worktree path
**And**: ThreadState is created with:
- `name: "feature-x"`
- `worktreePath: "/path/to/worktree"`
- `workingDir: "/path/to/worktree"`
- `branch: "feature-x"`
**And**: ThreadState is saved to repository
**And**: Returns `{ threadState }`

### TS2: Attach with Custom Name

**Given**: Worktree exists at `/path/to/worktree` with branch `feature-x`
**When**: `execute({ worktreePath, name: 'my-thread', workspaceRoot })` is called
**Then**: ThreadState is created with `name: "my-thread"`
**And**: Branch is still `"feature-x"`

### TS3: Invalid Worktree Path

**Given**: Path `/invalid/path` is not a valid worktree
**When**: `execute({ worktreePath: '/invalid/path', workspaceRoot })` is called
**Then**: `isValidWorktree()` returns false
**And**: Error is thrown: "Invalid git worktree at /invalid/path"
**And**: No terminal is created
**And**: No ThreadState is saved

### TS4: Branch Detection Fails

**Given**: Worktree is valid but `getWorktreeBranch()` fails
**When**: `execute({ worktreePath, workspaceRoot })` is called
**Then**: Error is thrown: "Failed to get branch name: <error message>"
**And**: No terminal is created
**And**: No ThreadState is saved

### TS5: Thread State Saved Correctly

**Given**: All validations pass
**When**: `execute()` completes successfully
**Then**: `threadStateRepository.save()` is called exactly once
**And**: Saved state has correct terminalId from createTerminal

## Acceptance Criteria

- [ ] IAttachToWorktreeUseCase interface is defined
- [ ] AttachToWorktreeInput has worktreePath, optional name, and workspaceRoot
- [ ] AttachToWorktreeOutput has threadState
- [ ] AttachToWorktreeUseCase implements IAttachToWorktreeUseCase
- [ ] Use case validates worktree before proceeding
- [ ] Use case gets branch name from worktree
- [ ] Use case uses provided name or defaults to branch name
- [ ] Use case creates terminal in worktree directory
- [ ] Use case creates ThreadState with correct metadata
- [ ] Use case saves ThreadState to repository
- [ ] Validation errors throw descriptive error messages
- [ ] Branch detection errors are caught and re-thrown with context
- [ ] No VSCode imports in application layer files

## Implementation Notes

### Similarity to CreateThreadUseCase

This use case is similar to `CreateThreadUseCase` with `isolationMode: 'worktree'`, but:
- **Does NOT** call `gitPort.createWorktree()` (worktree already exists)
- **Does** validate the worktree exists and is valid
- **Does** extract branch name from existing worktree instead of accepting it as input

### Shared Logic

Both use cases:
- Create terminal via `terminalPort.createTerminal()`
- Create `ThreadState` entity with worktree metadata
- Save state via `threadStateRepository.save()`

### Error Handling

- Validation failure: Throw error immediately, don't proceed
- Branch detection failure: Catch error, wrap with context, re-throw
- Let terminal/repository errors propagate naturally

## Files to Create

- `src/application/ports/inbound/IAttachToWorktreeUseCase.ts`
- `src/application/useCases/AttachToWorktreeUseCase.ts`

## Estimated Time

30 minutes
