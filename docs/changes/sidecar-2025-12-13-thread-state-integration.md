# Changes: Thread State Integration

## Summary

Connect existing thread-scoped features (Comment.threadId, ThreadState.whitelistPatterns) to the actual flow.

## Tasks Completed

### Task 1: Add setCurrentThread to FileWatchController

Added thread tracking capability to FileWatchController so it can apply per-thread whitelist patterns when a thread is selected.

**Changes**:

| File | Change |
|------|--------|
| `src/adapters/inbound/controllers/FileWatchController.ts` | Added thread tracking state and methods |

**Details**:

1. **Added thread tracking state fields** (lines 129-135):
   - `currentThreadId: string | null` - terminal ID of selected thread
   - `currentThreadPatterns: string[]` - thread's whitelist patterns
   - `currentThreadStateId: string | undefined` - thread state ID for repo ops

2. **Added `setCurrentThread()` method** (lines 205-217):
   - Stores thread ID, patterns, and state ID
   - Calls `rebuildIncludePatterns()` to apply combined patterns
   - Logs thread selection for debugging

3. **Added `getCurrentThreadId()` getter** (lines 222-225):
   - Returns current thread's terminal ID (or null)

4. **Added `getCurrentThreadStateId()` getter** (lines 230-232):
   - Returns current thread's state ID for repository operations

5. **Added `rebuildIncludePatterns()` method** (lines 237-258):
   - Resets `includePatterns` instance
   - Loads global patterns from config
   - Adds current thread patterns
   - Rebuilds whitelist watchers with new combined patterns

6. **Updated `loadIncludePatterns()`** (lines 295-298):
   - Now delegates to `rebuildIncludePatterns()` for consistent behavior

### Task 2: Add setComments to IPanelStateManager

Added method to bulk-set comments in panel state for efficient thread switching.

**Changes**:

| File | Change |
|------|--------|
| `src/application/services/IPanelStateManager.ts` | Added `setComments` to interface |
| `src/application/services/PanelStateManager.ts` | Implemented `setComments` method |

**Details**:

1. **Added to interface** (lines 51-55):
   ```typescript
   setComments(comments: CommentInfo[]): void;
   ```

2. **Implemented in PanelStateManager** (lines 408-414):
   - Replaces all comments in state with provided array
   - Creates a new array copy to avoid mutation
   - Triggers render to update UI

### Task 3: Modify ThreadListController.selectThread

Updated `selectThread` to apply thread's whitelist patterns and filter comments when a thread is selected.

**Changes**:

| File | Change |
|------|--------|
| `src/adapters/inbound/controllers/ThreadListController.ts` | Modified to handle thread state |

**Details**:

1. **Added imports** (lines 7-8):
   - `FileWatchController` from `./FileWatchController`
   - `ICommentRepository` from application ports

2. **Added optional constructor parameters** (lines 20-21):
   - `fileWatchController?: FileWatchController`
   - `commentRepository?: ICommentRepository`

3. **Made `selectThread` async** (lines 56-112):
   - Applies thread whitelist patterns via `fileWatchController.setCurrentThread()`
   - Sets threadId on state manager
   - Fetches and filters comments by threadId (includes legacy comments without threadId)
   - Maps Comment entities to CommentInfo for panel state

4. **Updated `cycleToNextThread` to async** (lines 124-138):
   - Awaits `selectThread` call

5. **Updated command registration** (lines 43-45):
   - Made callback async and awaits `selectThread`

6. **Updated `createThreadFromInput`** (line 179):
   - Awaits `selectThread` after thread creation

7. **Updated `createThread`** (line 248):
   - Awaits `selectThread` after thread creation

### Task 4: Update Whitelist Pattern Addition Flow

Added ability to save whitelist patterns to thread state when a thread is selected.

**Changes**:

| File | Change |
|------|--------|
| `src/adapters/inbound/controllers/FileWatchController.ts` | Added thread-aware whitelist pattern handling |

**Details**:

1. **Added import** (line 11):
   - `IThreadStateRepository` from application ports

2. **Added `threadStateRepository` property** (line 138):
   - For persisting thread state changes

3. **Added `setThreadStateRepository()` setter** (lines 200-202):
   - Allows wiring the repository dependency

4. **Added `addWhitelistPattern()` method** (lines 248-272):
   - If thread is selected: saves pattern to thread state via `updateWhitelist()`
   - If no thread: saves to global config (existing behavior)
   - Updates current patterns and rebuilds watchers
   - Deduplicates patterns (no duplicates added)

### Task 5: Wire Dependencies in extension.ts

Wired the new dependencies to connect all components for thread state integration.

**Changes**:

| File | Change |
|------|--------|
| `src/extension.ts` | Wired dependencies between controllers |

**Details**:

1. **Added `fileWatchController` and `commentRepository` to ThreadListController** (lines 103-104):
   - Passed as 5th and 6th constructor arguments
   - Enables thread selection to apply whitelist patterns and filter comments

2. **Wired `threadStateRepository` to FileWatchController** (line 93):
   - Called `fileWatchController.setThreadStateRepository(threadStateRepository)`
   - Enables whitelist patterns to be persisted to thread state

### Task 6: Add Tests

Added unit tests for the new thread state integration functionality.

**New test files**:

| File | Description |
|------|-------------|
| `src/test/adapters/controllers/FileWatchThreadSupport.test.ts` | Tests for FileWatchController thread support |
| `src/test/application/services/PanelStateManager.test.ts` | Tests for PanelStateManager.setComments |

**Test coverage**:

1. **FileWatchController Thread Support** (12 tests):
   - `setCurrentThread`: stores thread ID, patterns, state ID; triggers rebuild
   - `addWhitelistPattern`: saves to thread state or global config; deduplicates
   - `getCurrentThreadId`: returns current thread ID
   - `getCurrentThreadStateId`: returns current state ID

2. **PanelStateManager.setComments** (8 tests):
   - Replaces all comments with new array
   - Triggers render callback
   - Creates copy to avoid mutation
   - Preserves all comment properties
   - Handles multiple comments
   - Integration with thread switching scenario

## Validation

- `npm run compile`: Pass
- `npm run lint`: Pass (10 pre-existing warnings, 0 errors)
- `npm run test:unit`: New tests pass (20 tests added, all passing)
  - Pre-existing test failures unrelated to this feature

## Summary

All 6 tasks completed. Thread state integration is now fully implemented:

1. **Thread selection** applies whitelist patterns via `FileWatchController.setCurrentThread()`
2. **Comment filtering** by threadId when switching threads
3. **Legacy comments** (without threadId) are included for backward compatibility
4. **Whitelist pattern addition** saves to thread state when a thread is selected
5. **All components wired** in extension.ts for end-to-end integration
