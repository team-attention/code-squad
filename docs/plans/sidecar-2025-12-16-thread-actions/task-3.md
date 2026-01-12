# Task 3: IGitPort - Add Worktree/Branch Management Methods

## Goal

Extend IGitPort interface with methods for worktree removal, branch switching, and related operations.

## Location

`src/application/ports/outbound/IGitPort.ts`

## Changes

Add the following methods:

```typescript
/**
 * Remove a git worktree.
 * Executes `git worktree remove <path>`.
 *
 * @param worktreePath - Absolute path to worktree to remove
 * @param workspaceRoot - Root directory of main repository
 * @param force - Force removal even with uncommitted changes
 * @throws Error if worktree has uncommitted changes and force=false
 */
removeWorktree(worktreePath: string, workspaceRoot: string, force?: boolean): Promise<void>;

/**
 * Switch to a different branch in a directory.
 * Executes `git switch <branch>` or `git checkout <branch>`.
 *
 * @param workingDir - Directory to switch branch in (worktree path)
 * @param targetBranch - Branch name to switch to
 * @throws Error if branch doesn't exist or switch fails
 */
switchBranch(workingDir: string, targetBranch: string): Promise<void>;

/**
 * List all branches in a repository.
 * Executes `git branch -a`.
 *
 * @param workspaceRoot - Repository root directory
 * @returns Array of branch names (local and remote)
 */
listBranches(workspaceRoot: string): Promise<string[]>;

/**
 * Check if directory has uncommitted changes.
 * Executes `git status --porcelain`.
 *
 * @param workingDir - Directory to check
 * @returns true if uncommitted changes exist
 */
hasUncommittedChanges(workingDir: string): Promise<boolean>;

/**
 * Stash uncommitted changes.
 * Executes `git stash push -m "code-squad-auto"`.
 *
 * @param workingDir - Directory to stash in
 */
stashChanges(workingDir: string): Promise<void>;
```

## Test Scenarios

Interface-only change - tests will be added in Task 6 (VscodeGitGateway implementation).

## Dependencies

None
