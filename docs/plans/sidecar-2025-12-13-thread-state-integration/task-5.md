# Task 5: Wire Dependencies in extension.ts

## Goal

Wire the new dependencies between ThreadListController, FileWatchController, and CommentRepository.

## Location

`src/extension.ts`

## Changes

### 1. Pass FileWatchController to ThreadListController

Find where `ThreadListController` is instantiated and add `FileWatchController` reference:

```typescript
// Before
const threadListController = new ThreadListController(
    () => sessions,
    terminalGateway,
    createThreadUseCase,
    attachSidecar
);

// After
const threadListController = new ThreadListController(
    () => sessions,
    terminalGateway,
    createThreadUseCase,
    attachSidecar,
    fileWatchController,     // NEW
    commentRepository,       // NEW
);
```

### 2. Pass ThreadStateRepository to FileWatchController

```typescript
// After creating fileWatchController
fileWatchController.setThreadStateRepository(threadStateRepository);
```

### 3. Verify IThreadStateRepository Implementation Exists

Check if `JsonThreadStateRepository` or similar exists. If not, may need Task 4.5 to create it.

Look for existing patterns in `src/infrastructure/repositories/`.

## Test Scenario

Integration test: Full thread selection flow

```typescript
// Given: Extension is activated with thread and comments
// When: User selects thread via command
await vscode.commands.executeCommand('sidecar.selectThread', 'thread-1');

// Then: All integrations work
// - FileWatchController has thread patterns
// - Panel shows thread's comments
// - New comments save with threadId
```

## Acceptance Criteria

- [ ] ThreadListController receives FileWatchController reference
- [ ] ThreadListController receives CommentRepository reference
- [ ] FileWatchController receives ThreadStateRepository reference
- [ ] Full integration flow works end-to-end
