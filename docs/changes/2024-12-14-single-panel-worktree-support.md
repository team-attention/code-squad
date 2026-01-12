# Fix: Single Panel Architecture with Worktree Support

## Problem

When using multiple worktrees (a, b) and a local thread (c):
- File changes in worktrees a, b were not tracked
- Sidecar panel only showed files from c (the main workspace)

Root causes:
1. Multiple panels per terminal created confusion
2. VSCode's FileSystemWatcher only works within the opened workspace
3. Terminal ID mismatch between `CreateThreadUseCase` and `AIDetectionController`
4. `ThreadState` not connected to `SessionContext`

## Solution

### 1. Single Panel Architecture

Changed from "one panel per terminal" to "single panel with session switching":

- `SidecarPanelAdapter`: Now singleton, `switchToSession()` method switches context
- `AIDetectionController`: Creates sessions but shares single panel
- `ThreadListController`: Calls `panel.switchToSession()` on thread selection

### 2. Worktree File Tracking

- Use `ThreadState.worktreePath` as primary workspace root
- Node.js `fs.watch` for directories outside VSCode workspace
- `refreshFilesForSession()`: Fetch git status on thread selection
- `GenerateDiffUseCase.setWorkspaceRoot()`: Dynamic workspace root update

### 3. Terminal ID Consistency

- `VscodeTerminalGateway`: Added `terminalToId` reverse mapping
- `AIDetectionController.registerTerminalId()`: Check gateway ID first
- IDs now match between `CreateThreadUseCase` and session activation

### 4. ThreadState Integration

- `AIDetectionController`: Query `ThreadStateRepository` on session activation
- `SessionContext`: Store `threadState` for worktree path access
- Priority: `threadState.worktreePath` > `terminal.cwd` > workspace folder

## Files Changed

| File | Changes |
|------|---------|
| `SidecarPanelAdapter.ts` | Singleton pattern, `switchToSession()` |
| `AIDetectionController.ts` | ThreadState lookup, ID consistency |
| `ThreadListController.ts` | `refreshFilesForSession()`, git status fetch |
| `FileWatchController.ts` | Native `fs.watch` for worktrees |
| `VscodeTerminalGateway.ts` | Reverse terminal-to-ID mapping |
| `GenerateDiffUseCase.ts` | `setWorkspaceRoot()` method |
| `IGenerateDiffUseCase.ts` | Interface update |
| `SessionContext.ts` | `submitComments` callback field |
| `extension.ts` | Wire up `threadStateRepository` |

## Validation

- Compile: Pass
- Lint: Pass (existing warnings only)
- Manual test: Worktree switching works correctly
