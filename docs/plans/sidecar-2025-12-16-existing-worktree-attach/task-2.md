# Task 2: Implement Worktree Methods in VscodeGitGateway

## Goal

Implement the three new IGitPort methods (`listWorktrees`, `isValidWorktree`, `getWorktreeBranch`) in VscodeGitGateway using git commands.

## Location

`src/adapters/outbound/gateways/VscodeGitGateway.ts`

## Changes

### 1. Implement listWorktrees()

Add this method to the `VscodeGitGateway` class:

```typescript
async listWorktrees(workspaceRoot: string): Promise<WorktreeInfo[]> {
    return new Promise((resolve) => {
        exec(
            `cd "${workspaceRoot}" && git worktree list --porcelain`,
            { maxBuffer: 1024 * 1024 },
            (error, stdout) => {
                if (error) {
                    resolve([]);
                    return;
                }

                const worktrees: WorktreeInfo[] = [];
                const lines = stdout.split('\n').filter(line => line.trim());

                // Parse porcelain format: groups of 3 lines separated by blank lines
                // worktree /path
                // HEAD sha
                // branch refs/heads/name
                let i = 0;
                while (i < lines.length) {
                    const worktreeLine = lines[i];
                    const headLine = lines[i + 1];
                    const branchLine = lines[i + 2];

                    if (!worktreeLine || !headLine) {
                        i++;
                        continue;
                    }

                    const pathMatch = worktreeLine.match(/^worktree (.+)$/);
                    const headMatch = headLine.match(/^HEAD (.+)$/);
                    const branchMatch = branchLine?.match(/^branch refs\/heads\/(.+)$/);

                    if (pathMatch && headMatch) {
                        const path = pathMatch[1];
                        const head = headMatch[1];
                        const branch = branchMatch ? branchMatch[1] : 'HEAD';

                        // Skip main repository root (first entry)
                        // Main repo typically matches workspaceRoot
                        if (path !== workspaceRoot) {
                            worktrees.push({ path, branch, head });
                        }
                    }

                    // Move to next worktree entry
                    i += 3;
                }

                resolve(worktrees);
            }
        );
    });
}
```

### 2. Implement isValidWorktree()

Add this method to the `VscodeGitGateway` class:

```typescript
async isValidWorktree(path: string, workspaceRoot: string): Promise<boolean> {
    // Step 1: Check if path exists and is accessible
    try {
        const fs = await import('fs');
        await fs.promises.access(path, fs.constants.R_OK);
    } catch {
        return false;
    }

    // Step 2: Check if path is a valid git repository
    const isGitRepo = await new Promise<boolean>((resolve) => {
        exec(
            `cd "${path}" && git rev-parse --git-dir`,
            { maxBuffer: 1024 * 1024 },
            (error) => {
                resolve(!error);
            }
        );
    });

    if (!isGitRepo) {
        return false;
    }

    // Step 3: Verify path is listed in main repo's worktree list
    const worktrees = await this.listWorktrees(workspaceRoot);
    return worktrees.some(wt => wt.path === path);
}
```

### 3. Implement getWorktreeBranch()

Add this method to the `VscodeGitGateway` class:

```typescript
async getWorktreeBranch(worktreePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(
            `cd "${worktreePath}" && git rev-parse --abbrev-ref HEAD`,
            { maxBuffer: 1024 * 1024 },
            (error, stdout) => {
                if (error) {
                    reject(new Error(`Failed to get branch name: ${error.message}`));
                    return;
                }
                const branch = stdout.trim();
                resolve(branch);
            }
        );
    });
}
```

### 4. Import WorktreeInfo Type

Add to imports at the top of the file:

```typescript
import { IGitPort, FileStatus, WorktreeInfo } from '../../../application/ports/outbound/IGitPort';
```

## Test Scenarios

### TS1: List Worktrees - Happy Path

**Given**: Repository has 2 worktrees + main repo
**When**: `listWorktrees(workspaceRoot)` is called
**Then**: Returns array with 2 WorktreeInfo objects (excluding main repo)
**And**: Each object has path, branch, and head fields populated

### TS2: List Worktrees - No Worktrees

**Given**: Repository has no linked worktrees (only main repo)
**When**: `listWorktrees(workspaceRoot)` is called
**Then**: Returns empty array

### TS3: List Worktrees - Git Error

**Given**: Git command fails (not a git repo)
**When**: `listWorktrees(workspaceRoot)` is called
**Then**: Returns empty array (no error thrown)

### TS4: Parse Porcelain Format

**Given**: `git worktree list --porcelain` returns:
```
worktree /main
HEAD abc123
branch refs/heads/main

worktree /wt/feature-x
HEAD def456
branch refs/heads/feature-x
```
**When**: Output is parsed
**Then**: Main repo `/main` is excluded
**And**: Worktree `/wt/feature-x` is included with branch `feature-x`

### TS5: Validate Worktree - Valid Path

**Given**: Path exists, is git repo, and is in worktree list
**When**: `isValidWorktree(path, workspaceRoot)` is called
**Then**: Returns `true`

### TS6: Validate Worktree - Path Not Accessible

**Given**: Path does not exist or is not readable
**When**: `isValidWorktree(path, workspaceRoot)` is called
**Then**: Returns `false`

### TS7: Validate Worktree - Not a Git Repo

**Given**: Path exists but is not a git repository
**When**: `isValidWorktree(path, workspaceRoot)` is called
**Then**: Returns `false`

### TS8: Validate Worktree - Not in Worktree List

**Given**: Path is a git repo but not in `git worktree list`
**When**: `isValidWorktree(path, workspaceRoot)` is called
**Then**: Returns `false`

### TS9: Get Worktree Branch

**Given**: Worktree has branch `feature-login`
**When**: `getWorktreeBranch(worktreePath)` is called
**Then**: Returns `"feature-login"`

### TS10: Get Worktree Branch - Detached HEAD

**Given**: Worktree is in detached HEAD state
**When**: `getWorktreeBranch(worktreePath)` is called
**Then**: Returns `"HEAD"`

### TS11: Get Worktree Branch - Error

**Given**: Path is not a git repository
**When**: `getWorktreeBranch(worktreePath)` is called
**Then**: Promise is rejected with error message

## Acceptance Criteria

- [ ] `listWorktrees()` executes `git worktree list --porcelain`
- [ ] `listWorktrees()` parses output correctly to WorktreeInfo array
- [ ] `listWorktrees()` excludes main repository root
- [ ] `listWorktrees()` handles git errors gracefully (returns empty array)
- [ ] `isValidWorktree()` checks path accessibility
- [ ] `isValidWorktree()` validates git repository
- [ ] `isValidWorktree()` verifies path is in worktree list
- [ ] `getWorktreeBranch()` executes `git rev-parse --abbrev-ref HEAD`
- [ ] `getWorktreeBranch()` returns branch name
- [ ] `getWorktreeBranch()` rejects promise on error
- [ ] All error cases are handled appropriately
- [ ] WorktreeInfo type is imported

## Implementation Notes

### Git Worktree List Format

The `--porcelain` format outputs entries in groups:
```
worktree <path>
HEAD <sha>
branch refs/heads/<name>
<blank line>
```

The first entry is always the main repository. We must skip it.

### Error Handling Strategy

- `listWorktrees()`: Return empty array on error (don't throw)
- `isValidWorktree()`: Return false on any validation failure
- `getWorktreeBranch()`: Reject promise with descriptive error

### Path Normalization

Paths from `git worktree list` are absolute. No normalization needed.

## Files to Modify

- `src/adapters/outbound/gateways/VscodeGitGateway.ts`

## Estimated Time

45 minutes
