# Implementation Plan: Thread State Integration

## Summary

Connect existing thread-scoped features (Comment.threadId, ThreadState.whitelistPatterns) to the actual flow. When a thread is selected, apply its whitelist patterns and filter comments to show only that thread's comments.

## Technical Design

### Current State Analysis

Already implemented but **not connected**:

| Component | Location | Status |
|-----------|----------|--------|
| `Comment.threadId` | `domain/entities/Comment.ts` | Implemented |
| `AddCommentInput.threadId` | `application/ports/inbound/IAddCommentUseCase.ts` | Implemented |
| `ICommentRepository.findByThreadId` | `application/ports/outbound/ICommentRepository.ts` | Interface defined |
| `IPanelStateManager.setThreadId/getThreadId` | `application/services/IPanelStateManager.ts` | Implemented |
| `ThreadState.whitelistPatterns` | `domain/entities/ThreadState.ts` | Implemented |
| `SidecarPanelAdapter.handleAddComment` with `threadId` | `adapters/inbound/ui/SidecarPanelAdapter.ts:617` | Implemented |

**Missing connections**:

1. `ThreadListController.selectThread` does not call `setThreadId()` on the panel
2. `ThreadListController.selectThread` does not apply thread whitelist to `FileWatchController`
3. Comment filtering by thread is not implemented on thread switch
4. `FileWatchController` has no method to set/apply thread-specific whitelist
5. Whitelist pattern addition does not save to current thread's state

### Data Flow Changes

#### Thread Selection Flow (New)

```
ThreadListController.selectThread(id)
    │
    ├── Get SessionContext from sessions map
    │       └── SessionContext.threadState
    │
    ├── FileWatchController.setCurrentThread(id, patterns)
    │       └── Apply global + thread patterns
    │
    └── SidecarPanelAdapter.handleThreadSwitch(id, comments)
            ├── stateManager.setThreadId(id)
            └── stateManager.setComments(filteredComments)
```

#### Whitelist Addition Flow (Updated)

```
FileWatchController.addWhitelistPattern(pattern)
    │
    ├── (currentThreadId != null)
    │       └── ThreadState.addWhitelistPattern(pattern)
    │           └── ThreadStateRepository.save(threadState)
    │
    └── (currentThreadId == null)
            └── Global config update (existing behavior)
```

### API Changes

#### FileWatchController (Modify)

```typescript
class FileWatchController {
    // NEW: Current thread tracking
    private currentThreadId: string | null = null;
    private currentThreadPatterns: string[] = [];

    // NEW: Set current thread and apply its whitelist
    setCurrentThread(threadId: string | null, patterns: string[]): void;

    // MODIFY: Add pattern to current thread or global
    addWhitelistPattern(pattern: string): Promise<void>;
}
```

#### ThreadListController (Modify)

```typescript
class ThreadListController {
    constructor(
        // ... existing params
        private readonly fileWatchController?: FileWatchController,  // NEW
        private readonly commentRepository?: ICommentRepository,     // NEW
    ) {}

    // MODIFY: Add whitelist and comment handling
    selectThread(id: string): void {
        // ... existing code

        // NEW: Apply thread whitelist
        const patterns = context.threadState?.whitelistPatterns ?? [];
        this.fileWatchController?.setCurrentThread(id, patterns);

        // NEW: Filter and set comments
        const comments = await this.commentRepository?.findByThreadId(id);
        context.stateManager.setComments(comments);
    }
}
```

#### IPanelStateManager (Modify)

```typescript
interface IPanelStateManager {
    // ... existing methods

    // NEW: Bulk set comments (for thread switch)
    setComments(comments: CommentInfo[]): void;
}
```

## Test Scenarios

### TS1: Thread Selection Applies Whitelist

**Given**: Thread A has whitelist pattern `dist/**`
**When**: User selects Thread A
**Then**: `FileWatchController.setCurrentThread("A", ["dist/**"])` is called
**And**: Files matching `dist/**` appear in session files

### TS2: Thread Selection Filters Comments

**Given**: Thread A has 2 comments, Thread B has 3 comments
**When**: User selects Thread A
**Then**: Only Thread A's 2 comments are shown in panel
**And**: `stateManager.setComments()` is called with filtered comments

### TS3: Add Comment Saves ThreadId

**Given**: Thread A is selected
**When**: User adds a comment
**Then**: Comment is saved with `threadId: "A"`
**And**: Comment appears in panel (already implemented)

### TS4: Add Whitelist Pattern Saves to Thread

**Given**: Thread A is selected
**When**: User adds whitelist pattern `build/**`
**Then**: `ThreadState.addWhitelistPattern("build/**")` is called
**And**: Pattern is persisted in ThreadState

### TS5: No Thread Selected - Global Behavior

**Given**: No thread is selected (null)
**When**: User adds whitelist pattern
**Then**: Pattern is saved to global config (existing behavior)

### TS6: Comments Without ThreadId Show Everywhere

**Given**: Legacy comment exists with `threadId: undefined`
**When**: User selects any thread
**Then**: Legacy comment is still visible (backward compatibility)

## Tasks

| # | Task | Dependencies | Files |
|---|------|--------------|-------|
| 1 | Add `setCurrentThread` to FileWatchController | - | `FileWatchController.ts` |
| 2 | Add `setComments` to IPanelStateManager | - | `IPanelStateManager.ts`, `PanelStateManager.ts` |
| 3 | Modify ThreadListController.selectThread | 1, 2 | `ThreadListController.ts` |
| 4 | Update whitelist pattern addition flow | 1 | `FileWatchController.ts` |
| 5 | Wire dependencies in extension.ts | 3 | `extension.ts` |
| 6 | Add tests | 1-5 | Test files |

## Dependencies

- `JsonCommentRepository.findByThreadId` - Already exists
- `ThreadState.addWhitelistPattern` - Already exists
- `IPanelStateManager.setThreadId` - Already exists

## Success Criteria

1. Thread switch applies that thread's whitelist patterns
2. Thread switch shows only that thread's comments
3. New comments are associated with current thread
4. New whitelist patterns are saved to current thread
5. Backward compatibility: threadId-less comments visible everywhere
