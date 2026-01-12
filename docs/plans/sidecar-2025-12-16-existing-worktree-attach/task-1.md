# Task 1: Extend IGitPort with Worktree Operations

## Goal

Add interface methods to IGitPort for worktree discovery and validation operations.

## Location

`src/application/ports/outbound/IGitPort.ts`

## Changes

### 1. Add WorktreeInfo Interface

Add this interface before the `IGitPort` interface definition:

```typescript
export interface WorktreeInfo {
    path: string;        // Absolute path to worktree directory
    branch: string;      // Branch name (e.g., "feature-x", "main")
    head: string;        // Commit SHA
}
```

### 2. Add New Methods to IGitPort

Add these three methods to the `IGitPort` interface:

```typescript
export interface IGitPort {
    // ... existing methods

    /**
     * List all git worktrees in the repository.
     * Executes `git worktree list --porcelain` and parses output.
     * Excludes the main repository root (only returns linked worktrees).
     *
     * @param workspaceRoot - Root directory of the main repository
     * @returns Array of worktree information
     */
    listWorktrees(workspaceRoot: string): Promise<WorktreeInfo[]>;

    /**
     * Validate if a path is a valid git worktree.
     * Checks:
     * 1. Path exists and is accessible
     * 2. Path is a valid git repository
     * 3. Path is listed in `git worktree list` from main repo
     *
     * @param path - Path to validate
     * @param workspaceRoot - Root directory of the main repository
     * @returns True if path is a valid worktree
     */
    isValidWorktree(path: string, workspaceRoot: string): Promise<boolean>;

    /**
     * Get the branch name for a worktree.
     * Executes `git rev-parse --abbrev-ref HEAD` in the worktree directory.
     *
     * @param worktreePath - Absolute path to worktree
     * @returns Branch name (e.g., "feature-x") or "HEAD" for detached state
     */
    getWorktreeBranch(worktreePath: string): Promise<string>;
}
```

## Test Scenarios

### TS1: WorktreeInfo Type Definition

**Given**: WorktreeInfo interface is defined
**When**: Creating a WorktreeInfo object
**Then**: Object has required fields: path, branch, head
**And**: TypeScript compilation succeeds

### TS2: IGitPort Interface Extended

**Given**: IGitPort interface has new methods
**When**: Implementing IGitPort
**Then**: TypeScript requires implementation of:
- `listWorktrees(workspaceRoot: string): Promise<WorktreeInfo[]>`
- `isValidWorktree(path: string, workspaceRoot: string): Promise<boolean>`
- `getWorktreeBranch(worktreePath: string): Promise<string>`

## Acceptance Criteria

- [ ] `WorktreeInfo` interface is defined with path, branch, and head fields
- [ ] `listWorktrees()` method is added to IGitPort interface
- [ ] `isValidWorktree()` method is added to IGitPort interface
- [ ] `getWorktreeBranch()` method is added to IGitPort interface
- [ ] All methods have proper JSDoc comments
- [ ] TypeScript compilation succeeds
- [ ] No breaking changes to existing IGitPort methods

## Implementation Notes

This task is pure interface definition in the application layer. No VSCode imports are allowed. The actual implementation will be in Task 2 (VscodeGitGateway).

## Files to Modify

- `src/application/ports/outbound/IGitPort.ts`

## Estimated Time

15 minutes
