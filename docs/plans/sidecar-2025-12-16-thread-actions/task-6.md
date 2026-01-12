# Task 6: VscodeGitGateway - Implement Worktree/Branch Methods

## Goal

Implement worktree removal, branch switching, and related git operations in VscodeGitGateway.

## Location

`src/adapters/outbound/gateways/VscodeGitGateway.ts`

## Changes

### removeWorktree

```typescript
async removeWorktree(worktreePath: string, workspaceRoot: string, force = false): Promise<void> {
  const args = ['worktree', 'remove', worktreePath];
  if (force) {
    args.push('--force');
  }
  await this.execGit(args, workspaceRoot);
}
```

### switchBranch

```typescript
async switchBranch(workingDir: string, targetBranch: string): Promise<void> {
  await this.execGit(['switch', targetBranch], workingDir);
}
```

### listBranches

```typescript
async listBranches(workspaceRoot: string): Promise<string[]> {
  const output = await this.execGit(['branch', '-a', '--format=%(refname:short)'], workspaceRoot);
  return output
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}
```

### hasUncommittedChanges

```typescript
async hasUncommittedChanges(workingDir: string): Promise<boolean> {
  const output = await this.execGit(['status', '--porcelain'], workingDir);
  return output.trim().length > 0;
}
```

### stashChanges

```typescript
async stashChanges(workingDir: string): Promise<void> {
  await this.execGit(['stash', 'push', '-m', 'code-squad-auto'], workingDir);
}
```

## Helper Method

Ensure `execGit` helper exists or create it:

```typescript
private async execGit(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn('git', args, { cwd });
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', data => stdout += data);
    process.stderr.on('data', data => stderr += data);

    process.on('close', code => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Git command failed: ${stderr}`));
      }
    });
  });
}
```

## Test Scenarios

### GG1: Remove worktree (clean)
- **Given**: Worktree at /path/to/worktree exists, no uncommitted changes
- **When**: `removeWorktree("/path/to/worktree", "/workspace")`
- **Then**: Worktree removed, directory deleted

### GG2: Remove worktree (dirty, no force)
- **Given**: Worktree exists with uncommitted changes
- **When**: `removeWorktree("/path/to/worktree", "/workspace", false)`
- **Then**: Error thrown

### GG3: Remove worktree (dirty, force)
- **Given**: Worktree exists with uncommitted changes
- **When**: `removeWorktree("/path/to/worktree", "/workspace", true)`
- **Then**: Worktree removed despite uncommitted changes

### GG4: Switch branch (exists)
- **Given**: Branch "feature/test" exists
- **When**: `switchBranch("/worktree", "feature/test")`
- **Then**: Branch switched, HEAD points to feature/test

### GG5: Switch branch (not exists)
- **Given**: Branch "nonexistent" doesn't exist
- **When**: `switchBranch("/worktree", "nonexistent")`
- **Then**: Error thrown

### GG6: List branches
- **Given**: Repository with branches main, feature/a, feature/b
- **When**: `listBranches("/workspace")`
- **Then**: Returns ["main", "feature/a", "feature/b", ...]

### GG7: Has uncommitted changes (clean)
- **Given**: Working directory is clean
- **When**: `hasUncommittedChanges("/worktree")`
- **Then**: Returns false

### GG8: Has uncommitted changes (dirty)
- **Given**: Working directory has modified files
- **When**: `hasUncommittedChanges("/worktree")`
- **Then**: Returns true

### GG9: Stash changes
- **Given**: Working directory has uncommitted changes
- **When**: `stashChanges("/worktree")`
- **Then**: Changes stashed with message "code-squad-auto"

## Dependencies

- Task 3 (IGitPort interface)
