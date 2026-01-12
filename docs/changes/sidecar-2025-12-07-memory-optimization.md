# Memory Optimization Implementation

## Summary

Implemented memory optimization measures across 9 tasks to reduce memory leaks and optimize memory usage in the Sidecar extension.

## Changes Made

### Task 1: Webview Event Listener Cleanup
- **File**: `src/adapters/inbound/ui/webview/script.ts`
- Added global `AbortController` for centralized event listener cleanup
- All `addEventListener` calls now include `{ signal: getSignal() }` option
- Added `cleanup()` function that clears all state on dispose
- Message handler responds to `dispose` message type

### Task 2: Limit Global Collection Sizes
- **File**: `src/adapters/inbound/ui/webview/script.ts`
- Added size limits: `MAX_COLLAPSED_FOLDERS = 1000`, `MAX_SEARCH_MATCHES = 500`, `MAX_HIGHLIGHT_ENTRIES = 10000`
- `addCollapsedFolder()` helper implements LRU-style eviction
- `performDiffSearch()` stops early when limit reached
- `onFileChange()` clears file-specific collections

### Task 3: Panel Dispose Message Handler
- **File**: `src/adapters/inbound/ui/SidecarPanelAdapter.ts`
- `dispose()` now sends `{ type: 'dispose' }` message to webview before cleanup
- Comprehensive cleanup function clears all collections and DOM

### Task 4: Circular Buffer for eventCountWindow
- **File**: `src/adapters/inbound/controllers/FileWatchController.ts`
- Added `CircularBuffer<T>` class with fixed capacity (1000)
- Replaced `eventCountWindow: number[]` with `CircularBuffer<number>`
- `logStats()` uses `countIf()` instead of array filtering
- Memory usage now bounded regardless of event rate

### Task 5: Session Timeout and Error Cleanup
- **Files**: `src/adapters/inbound/controllers/AIDetectionController.ts`, `src/application/ports/outbound/SessionContext.ts`
- Added `lastActivityTime` field to `SessionContext`
- 5-minute cleanup interval checks for stale sessions
- 1-hour timeout for inactive sessions
- `getActiveSession()` optimized to avoid `Array.from()` allocation

### Task 6: HNApiGateway Buffer Optimization
- **File**: `src/adapters/outbound/gateways/HNApiGateway.ts`
- Replaced string concatenation with `Buffer[]` array
- 1MB response size limit with early termination
- `Buffer.concat()` for efficient data assembly
- Chunks cleared on error or after use

### Task 7: Static Panel Map Cleanup
- **File**: `src/adapters/inbound/ui/SidecarPanelAdapter.ts`, `src/extension.ts`
- Added `startCleanupInterval()` / `stopCleanupInterval()` static methods
- 10-minute interval removes stale panels from `activePanels` map
- `isActive()` method checks if panel is still valid
- `dispose()` removes from map first, uses try/catch for safety
- `currentPanel` getter avoids `Array.from()` allocation

### Task 8: State Update Optimization
- **File**: `src/application/services/PanelStateManager.ts`
- Removed unnecessary object spreading for primitive field updates
- Direct mutation with `push()`, `splice()`, and assignment
- `markCommentsAsSubmitted()` iterates directly instead of `map()`
- All updates still call `render()` for notification

### Task 9: Snapshot Repository Size Limits
- **Files**: `src/infrastructure/repositories/InMemorySnapshotRepository.ts`, `src/application/ports/outbound/ISnapshotRepository.ts`
- Max 100 snapshots, max 100KB per file
- LRU eviction via `accessOrder` array
- `save()` returns `boolean` (false if size exceeded)
- `getStats()` method for monitoring

## Test Results

- **Compile**: Passed
- **Unit Tests**: 90 passing, 1 failing (pre-existing failure unrelated to this change)

## Files Modified

1. `src/adapters/inbound/ui/webview/script.ts`
2. `src/adapters/inbound/ui/SidecarPanelAdapter.ts`
3. `src/adapters/inbound/controllers/FileWatchController.ts`
4. `src/adapters/inbound/controllers/AIDetectionController.ts`
5. `src/adapters/outbound/gateways/HNApiGateway.ts`
6. `src/application/services/PanelStateManager.ts`
7. `src/application/ports/outbound/SessionContext.ts`
8. `src/application/ports/outbound/ISnapshotRepository.ts`
9. `src/infrastructure/repositories/InMemorySnapshotRepository.ts`
10. `src/extension.ts`
11. `src/test/application/useCases/CaptureSnapshotsUseCase.test.ts`
12. `src/test/application/useCases/GenerateDiffUseCase.test.ts`
