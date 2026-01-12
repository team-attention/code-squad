# Task 1: ThreadState Entity - Add Immutable Update Methods

## Goal

Add `withName()` and `withBranch()` methods to ThreadState entity for immutable updates.

## Location

`src/domain/entities/ThreadState.ts`

## Changes

Add two methods to create new ThreadState instances with updated values:

```typescript
withName(newName: string): ThreadState {
  return new ThreadState(
    this.threadId,
    newName,
    this.terminalId,
    this.isolationMode,
    this.branch,
    this.worktreePath,
    this.whitelistPatterns
  );
}

withBranch(newBranch: string): ThreadState {
  return new ThreadState(
    this.threadId,
    this.name,
    this.terminalId,
    this.isolationMode,
    newBranch,
    this.worktreePath,
    this.whitelistPatterns
  );
}
```

## Validation Rules

- `withName()`:
  - Name must be non-empty
  - Name length: 1-50 characters
  - Allowed characters: alphanumeric, hyphens, underscores, slashes

- `withBranch()`:
  - Branch must be non-empty
  - Standard git branch name rules

## Test Scenarios

### TS1: Create ThreadState with new name
- **Given**: ThreadState with name "original-name"
- **When**: `threadState.withName("new-name")`
- **Then**: Returns new ThreadState with name="new-name", all other fields unchanged

### TS2: Create ThreadState with new branch
- **Given**: ThreadState with branch "feature/old"
- **When**: `threadState.withBranch("feature/new")`
- **Then**: Returns new ThreadState with branch="feature/new", all other fields unchanged

### TS3: Validate name not empty
- **Given**: ThreadState exists
- **When**: `threadState.withName("")`
- **Then**: Throws validation error

### TS4: Validate name length
- **Given**: ThreadState exists
- **When**: `threadState.withName("a".repeat(51))`
- **Then**: Throws validation error (max 50 chars)

### TS5: Original instance unchanged
- **Given**: ThreadState with name "original"
- **When**: `const newState = threadState.withName("new")`
- **Then**: `threadState.name` still equals "original"

## Dependencies

None
