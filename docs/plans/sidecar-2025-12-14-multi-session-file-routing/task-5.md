# Task 5: Integrate Tracking into FileWatchController

## Goal

Hook the file ownership tracking into the file change detection flow.

## Layer

Adapter

## Files

- `src/adapters/inbound/controllers/FileWatchController.ts` - Modify existing controller

## Implementation Steps

1. Add `ITrackFileOwnershipUseCase` as a new constructor dependency

2. In `processFileChange()` method (around line 731-803):
   - After detecting which session the file change belongs to
   - Extract `threadId` from `session.threadState?.threadId`
   - If threadId exists, call `trackFileOwnershipUseCase.execute({ filePath, threadId })`

3. Key location in `processFileChange()`:
   ```typescript
   // Around line 795-800, after notifyFileChange
   if (session.threadState?.threadId) {
       await this.trackFileOwnershipUseCase.execute({
           filePath: data.relativePath,
           threadId: session.threadState.threadId
       });
   }
   ```

4. Update `FileWatchController` constructor signature and update calls in `extension.ts`

## Test Scenarios

None - Integration with existing system. Manual testing to verify:
- When Thread A modifies file1.ts, ownership is recorded
- When Thread B modifies file2.ts, ownership is recorded
- When Thread A then modifies file2.ts, ownership changes to Thread A

## Reference Code

Current `processFileChange` structure (simplified):

```typescript
private processFileChange(data: FileChangeData): void {
    // ... iterate through sessions
    for (const [_, session] of this.sessions) {
        // Check if file belongs to session's workspace
        if (session.workspaceRoot && /* ... */) {
            // Existing: notify panel of file change
            this.notifyFileChange(session, data.relativePath, /* ... */);

            // NEW: track file ownership
            if (session.threadState?.threadId) {
                this.trackFileOwnershipUseCase.execute({
                    filePath: data.relativePath,
                    threadId: session.threadState.threadId
                });
            }
        }
    }
}
```

## Validation

- [ ] Use case injected via constructor
- [ ] Tracking called in processFileChange
- [ ] Thread ID properly extracted from session
- [ ] Type check passes
- [ ] Manual testing confirms ownership tracking
