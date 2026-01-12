# Changes: Multi-Session File Routing

**Spec**: `docs/specs/sidecar-2025-12-14-multi-session-file-routing.md`
**Plan**: `docs/plans/sidecar-2025-12-14-multi-session-file-routing/`

## Summary

Implemented file ownership tracking and comment routing for multi-thread scenarios. When files are modified, the system now tracks which thread modified them. Comments on files are routed to their owner threads instead of the focused thread.

## Implementation

### Domain Layer

1. **FileThreadMapping Entity** (`src/domain/entities/FileThreadMapping.ts`)
   - New entity tracking file-to-thread relationships
   - Contains: `filePath`, `threadId`, `lastModifiedAt`
   - Factory methods: `create()`, `fromData()`

### Application Layer

2. **IFileThreadMappingRepository Port** (`src/application/ports/outbound/IFileThreadMappingRepository.ts`)
   - Interface for file-thread mapping storage
   - Methods: `save`, `findByFilePath`, `findByThreadId`, `findAll`, `delete`, `clear`

3. **TrackFileOwnershipUseCase** (`src/application/useCases/TrackFileOwnershipUseCase.ts`)
   - Records which thread modified a file
   - Input: `{ filePath, threadId }`
   - Skips empty threadId

4. **SubmitCommentsUseCase Enhancement**
   - New `executeWithRouting()` method
   - Groups comments by file, looks up owner thread from mapping
   - Routes comments to owner threads with fallback to focused thread
   - New dependencies: `IFileThreadMappingRepository`, `IThreadStateRepository`

5. **PanelState Enhancement** (`src/application/ports/outbound/PanelState.ts`)
   - `FileInfo` extended with `ownerThreadId` and `ownerThreadName`
   - `PanelState` gains `threadCount` for UI badge logic

6. **IPanelStateManager Enhancement**
   - New `setThreadCount()` method

### Infrastructure Layer

7. **InMemoryFileThreadMappingRepository** (`src/infrastructure/repositories/InMemoryFileThreadMappingRepository.ts`)
   - In-memory implementation of `IFileThreadMappingRepository`
   - Uses Map with filePath as key

### Adapter Layer

8. **FileWatchController Enhancement**
   - Injects `ITrackFileOwnershipUseCase`
   - Calls tracking on file changes for focused thread
   - Separate tracking for worktree sessions

9. **DiffHeader UI Enhancement** (`src/adapters/inbound/ui/webview/components/diff/DiffHeader.ts`)
   - New props: `ownerThreadName`, `multipleThreadsExist`
   - Renders thread badge `[ThreadName]` when multiple threads exist
   - CSS styles added for `.thread-badge`

### Entry Point

10. **extension.ts Wiring**
    - Creates `InMemoryFileThreadMappingRepository`
    - Creates `TrackFileOwnershipUseCase`
    - Wires dependencies to `FileWatchController` and `SubmitCommentsUseCase`

## Files Changed

### New Files
- `src/domain/entities/FileThreadMapping.ts`
- `src/application/ports/outbound/IFileThreadMappingRepository.ts`
- `src/application/ports/inbound/ITrackFileOwnershipUseCase.ts`
- `src/application/useCases/TrackFileOwnershipUseCase.ts`
- `src/infrastructure/repositories/InMemoryFileThreadMappingRepository.ts`
- `src/test/infrastructure/repositories/InMemoryFileThreadMappingRepository.test.ts`
- `src/test/application/useCases/TrackFileOwnershipUseCase.test.ts`
- `src/test/application/useCases/SubmitCommentsRoutingUseCase.test.ts`

### Modified Files
- `src/domain/entities/index.ts` - Export FileThreadMapping
- `src/application/ports/outbound/index.ts` - Export IFileThreadMappingRepository
- `src/application/ports/inbound/index.ts` - Export ITrackFileOwnershipUseCase
- `src/application/useCases/index.ts` - Export TrackFileOwnershipUseCase
- `src/application/ports/inbound/ISubmitCommentsUseCase.ts` - Add executeWithRouting
- `src/application/useCases/SubmitCommentsUseCase.ts` - Implement routing logic
- `src/application/ports/outbound/PanelState.ts` - Add owner fields and threadCount
- `src/application/services/IPanelStateManager.ts` - Add setThreadCount
- `src/application/services/PanelStateManager.ts` - Implement setThreadCount
- `src/infrastructure/repositories/index.ts` - Export InMemoryFileThreadMappingRepository
- `src/adapters/inbound/controllers/FileWatchController.ts` - Add tracking integration
- `src/adapters/inbound/ui/webview/components/diff/DiffHeader.ts` - Add thread badge
- `src/adapters/inbound/ui/webview/components/diff/index.ts` - Export renderThreadBadge
- `src/adapters/inbound/ui/webview/styles.ts` - Add thread-badge styles
- `src/extension.ts` - Wire new dependencies

## Test Results

All new tests pass:
- `InMemoryFileThreadMappingRepository` - 8 tests
- `TrackFileOwnershipUseCase` - 4 tests
- `SubmitCommentsUseCase - Routing` - 5 tests

## Bug Fixes

### Duplicate Files in Changes Panel (Post-implementation fix)

**Issue**: When switching threads or refreshing the file list, the same file could appear twice - once in `sessionFiles` and once in `uncommittedFiles`.

**Root Cause**: `setBaseline()` in `PanelStateManager` was setting all git uncommitted files to `uncommittedFiles` without filtering out files already in `sessionFiles`. When `showUncommitted` was enabled in the UI, both arrays were combined, causing duplicates.

**Fix**: Modified `setBaseline()` to filter out files that are already in `sessionFiles` before updating `uncommittedFiles`.

```typescript
setBaseline(files: FileInfo[]): void {
    // Filter out files that are already in sessionFiles to avoid duplicates
    const sessionFilePaths = new Set(this.state.sessionFiles.map(f => f.path));
    const filteredFiles = files.filter(f => !sessionFilePaths.has(f.path));

    this.baselineSet = new Set(filteredFiles.map((f) => f.path));
    this.state = {
        ...this.state,
        uncommittedFiles: filteredFiles,
    };
    this.render();
}
```

## Validation

- [x] Type check passes
- [x] Lint passes (no new warnings)
- [x] New tests pass
- [x] Architecture rules respected (no vscode imports in domain/application)
