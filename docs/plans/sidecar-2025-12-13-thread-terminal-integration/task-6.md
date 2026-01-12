# Task 6: Create CreateThreadUseCase

## Scope

Implement the use case for creating a new thread with optional branch/worktree isolation.

## Deliverables

1. `src/application/ports/inbound/ICreateThreadUseCase.ts` - Use case interface
2. `src/application/useCases/CreateThreadUseCase.ts` - Use case implementation
3. Wire in `src/extension.ts`

## Technical Design

```typescript
// src/application/ports/inbound/ICreateThreadUseCase.ts
import { ThreadState } from '../../../domain/entities/ThreadState';

export type IsolationMode = 'none' | 'branch' | 'worktree';

export interface CreateThreadInput {
  name: string;
  isolationMode: IsolationMode;
  branchName?: string;
  workspaceRoot: string;
}

export interface CreateThreadOutput {
  threadState: ThreadState;
}

export interface ICreateThreadUseCase {
  execute(input: CreateThreadInput): Promise<CreateThreadOutput>;
}

// src/application/useCases/CreateThreadUseCase.ts
export class CreateThreadUseCase implements ICreateThreadUseCase {
  constructor(
    private readonly threadStateRepository: IThreadStateRepository,
    private readonly terminalPort: ITerminalPort,
    private readonly gitPort: IGitPort,
  ) {}

  async execute(input: CreateThreadInput): Promise<CreateThreadOutput> {
    const { name, isolationMode, branchName, workspaceRoot } = input;
    const effectiveBranchName = branchName ?? name;

    let workingDir = workspaceRoot;
    let branch: string | undefined;
    let worktreePath: string | undefined;

    // Handle isolation mode
    if (isolationMode === 'branch') {
      await this.gitPort.createBranch(effectiveBranchName, workspaceRoot);
      branch = effectiveBranchName;
    } else if (isolationMode === 'worktree') {
      worktreePath = path.join(path.dirname(workspaceRoot), effectiveBranchName);
      await this.gitPort.createWorktree(worktreePath, effectiveBranchName, workspaceRoot);
      workingDir = worktreePath;
      branch = effectiveBranchName;
    }

    // Create terminal
    const terminalId = await this.terminalPort.createTerminal(name, workingDir);

    // Create and save thread state
    const threadState = ThreadState.create({
      name,
      terminalId,
      workingDir,
      branch,
      worktreePath,
      whitelistPatterns: [],
    });

    await this.threadStateRepository.save(threadState);

    return { threadState };
  }
}
```

## Test Scenarios

### TS6.1: Create Thread with No Isolation

**Given**: Workspace at /project
**When**: CreateThreadUseCase.execute({ name: "fix-bug", isolationMode: "none", workspaceRoot: "/project" })
**Then**:
- Terminal created with name "fix-bug" and cwd "/project"
- ThreadState saved with workingDir "/project"
- No branch or worktreePath set

### TS6.2: Create Thread with Branch Isolation

**Given**: Workspace at /project on branch "main"
**When**: CreateThreadUseCase.execute({ name: "fix-bug", isolationMode: "branch", workspaceRoot: "/project" })
**Then**:
- Branch "fix-bug" created from "main"
- Terminal created with name "fix-bug" and cwd "/project"
- ThreadState saved with branch "fix-bug"

### TS6.3: Create Thread with Worktree Isolation

**Given**: Workspace at /project
**When**: CreateThreadUseCase.execute({ name: "fix-bug", isolationMode: "worktree", workspaceRoot: "/project" })
**Then**:
- Worktree created at /fix-bug with branch "fix-bug"
- Terminal created with name "fix-bug" and cwd "/fix-bug"
- ThreadState saved with worktreePath "/fix-bug" and branch "fix-bug"

### TS6.4: Create Thread with Custom Branch Name

**Given**: Workspace at /project
**When**: CreateThreadUseCase.execute({ name: "fix-bug", isolationMode: "branch", branchName: "feature/fix-login", workspaceRoot: "/project" })
**Then**:
- Branch "feature/fix-login" created (not "fix-bug")
- ThreadState saved with branch "feature/fix-login"

### TS6.5: Git Error Handling

**Given**: Workspace at /project, branch "fix-bug" already exists
**When**: CreateThreadUseCase.execute({ name: "fix-bug", isolationMode: "branch", workspaceRoot: "/project" })
**Then**: Throws error with meaningful message

## Files to Modify

| File | Action |
|------|--------|
| `src/application/ports/inbound/ICreateThreadUseCase.ts` | CREATE |
| `src/application/useCases/CreateThreadUseCase.ts` | CREATE |
| `src/extension.ts` | MODIFY - wire use case |

## Dependencies

- Task 1: ThreadState entity
- Task 2: IThreadStateRepository
- Task 3: JsonThreadStateRepository (implementation)
- Task 4: ITerminalPort.createTerminal
- Task 5: IGitPort branch/worktree methods

## Notes

- Worktree path is `../{branchName}` relative to workspace
- Terminal ID comes from createTerminal return value
- ThreadState persisted immediately after creation
- Git operations happen before terminal creation
