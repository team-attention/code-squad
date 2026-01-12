# Task 5: Extend IGitPort with Branch/Worktree Methods

## Scope

Add git branch and worktree creation capabilities to the git port interface and gateway.

## Deliverables

1. Create `src/application/ports/outbound/IGitPort.ts` - Git port interface
2. Create `src/adapters/outbound/gateways/VscodeGitGateway.ts` - Git gateway implementation
3. Wire in `src/extension.ts`

## Technical Design

```typescript
// src/application/ports/outbound/IGitPort.ts
export interface IGitPort {
  getCurrentBranch(workspaceRoot: string): Promise<string>;
  createBranch(name: string, workspaceRoot: string): Promise<void>;
  createWorktree(path: string, branch: string, workspaceRoot: string): Promise<void>;
  getWorktreeRoot(workspaceRoot: string): Promise<string | null>;
}

// src/adapters/outbound/gateways/VscodeGitGateway.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { IGitPort } from '../../application/ports/outbound/IGitPort';

const execAsync = promisify(exec);

export class VscodeGitGateway implements IGitPort {
  async getCurrentBranch(workspaceRoot: string): Promise<string> {
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: workspaceRoot });
    return stdout.trim();
  }

  async createBranch(name: string, workspaceRoot: string): Promise<void> {
    await execAsync(`git checkout -b ${name}`, { cwd: workspaceRoot });
  }

  async createWorktree(path: string, branch: string, workspaceRoot: string): Promise<void> {
    await execAsync(`git worktree add "${path}" -b ${branch}`, { cwd: workspaceRoot });
  }

  async getWorktreeRoot(workspaceRoot: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync('git rev-parse --show-toplevel', { cwd: workspaceRoot });
      return stdout.trim();
    } catch {
      return null;
    }
  }
}
```

## Test Scenarios

### TS5.1: Get Current Branch

**Given**: Git repository on branch "main"
**When**: getCurrentBranch() is called
**Then**: Returns "main"

### TS5.2: Create Branch

**Given**: Git repository on branch "main"
**When**: createBranch("feature/test") is called
**Then**:
- New branch "feature/test" is created
- Checkout switches to new branch

### TS5.3: Create Worktree

**Given**: Git repository at /project
**When**: createWorktree("/project-wt", "feature/test") is called
**Then**:
- Worktree created at /project-wt
- New branch "feature/test" is created
- Worktree is on that branch

### TS5.4: Create Worktree with Existing Branch Fails

**Given**: Git repository with existing branch "main"
**When**: createWorktree("/path", "main") is called
**Then**: Throws error (branch already exists)

### TS5.5: Get Worktree Root

**Given**: Terminal cwd in worktree at /project-wt
**When**: getWorktreeRoot() is called
**Then**: Returns /project-wt

## Files to Modify

| File | Action |
|------|--------|
| `src/application/ports/outbound/IGitPort.ts` | CREATE |
| `src/adapters/outbound/gateways/VscodeGitGateway.ts` | CREATE |
| `src/extension.ts` | MODIFY - wire gateway |

## Dependencies

None - independent of other tasks.

## Notes

- Uses child_process exec for git commands
- Branch names should be sanitized before use
- Worktree path defaults to `../{name}` relative to workspace
- Error handling for non-git directories
