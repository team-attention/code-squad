# Implementation Plan: File Watch Optimization with Git Extension API

**Spec**: `docs/specs/sidecar-2025-12-11-file-watch-optimization.md`
**Created**: 2025-12-11

## Overview

Replace the global file system watcher pattern (`'**/*'`) with a hybrid approach using VSCode Git Extension API for git-tracked file changes and pattern-specific FileSystemWatcher instances for whitelisted files. This optimization dramatically reduces resource usage by eliminating watch events for untracked, non-whitelisted files.

## Problem Summary

| Issue | Impact | Solution |
|-------|--------|----------|
| Global `'**/*'` watcher triggers on ALL file changes | High CPU, memory from processing unnecessary events | Use Git Extension API `repo.state.onDidChange` for tracked files |
| node_modules, build artifacts, IDE files all trigger events | Heavy filtering overhead for every event | Only watch whitelisted patterns via separate watchers |
| Debouncing overhead for files Sidecar never needs | Wasted timer management, memory for pending events | No watcher = no event = no overhead |
| ~1000+ events/minute in large workspaces | Performance degradation, battery drain | Expected 90%+ reduction in events |

## Technical Design

### Architecture Overview

```
Before:                              After:
┌─────────────────┐                 ┌─────────────────────────────┐
│ FileSystemWatcher │                │ Git Extension API            │
│    '**/*'        │                │ repo.state.onDidChange       │
└────────┬────────┘                 └──────────────┬──────────────┘
         │                                         │
         │ ALL file events                         │ Only git state changes
         ▼                                         ▼
┌─────────────────┐                 ┌─────────────────────────────┐
│ shouldTrack()   │                 │ workingTreeChanges +        │
│ gitignore check │                 │ indexChanges extraction     │
│ whitelist check │                 └──────────────┬──────────────┘
└────────┬────────┘                                │
         │                                         │
         ▼                          ┌──────────────┴──────────────┐
┌─────────────────┐                 │        ┌─────────────────┐  │
│ processFileChange│                 │        │ WhitelistWatcher │  │
└─────────────────┘                 │        │ per pattern      │  │
                                    │        └─────────┬───────┘  │
                                    │                  │          │
                                    ▼                  ▼          │
                                 ┌────────────────────────────────┤
                                 │    processFileChange           │
                                 └────────────────────────────────┘
```

### Layer Placement

| Component | Layer | Rationale |
|-----------|-------|-----------|
| Git Extension integration | Adapters (Inbound) | VSCode-specific API |
| Whitelist watchers | Adapters (Inbound) | VSCode FileSystemWatcher |
| processFileChange logic | Adapters (Inbound) | Event handling (unchanged) |
| Session notification | Application | Use case orchestration (unchanged) |

### Git Extension Types

```typescript
// Type definitions for Git Extension API (not shipped with @types/vscode)
interface GitExtension {
  getAPI(version: 1): GitAPI;
}

interface GitAPI {
  repositories: Repository[];
  onDidOpenRepository: vscode.Event<Repository>;
  onDidCloseRepository: vscode.Event<Repository>;
}

interface Repository {
  rootUri: vscode.Uri;
  state: RepositoryState;
}

interface RepositoryState {
  workingTreeChanges: Change[];
  indexChanges: Change[];
  onDidChange: vscode.Event<void>;
}

interface Change {
  uri: vscode.Uri;
  status: Status; // Modified, Added, Deleted, Renamed, etc.
}
```

### Data Structures (Additions)

```typescript
// In FileWatchController class:
private gitAPI: GitAPI | undefined;
private repository: Repository | undefined;
private repositoryStateSubscription: vscode.Disposable | undefined;
private whitelistWatchers: vscode.FileSystemWatcher[] = [];
private lastProcessedChanges: Map<string, number> = new Map(); // path -> timestamp for dedup
```

### Event Flow

**Git-Tracked Files:**
1. `repo.state.onDidChange` fires
2. Query `repo.state.workingTreeChanges` + `repo.state.indexChanges`
3. Deduplicate by file path
4. For each changed file, call `processFileChange()` directly (no debounce needed - git batches changes)

**Whitelisted Files:**
1. Pattern-specific FileSystemWatcher triggers
2. Apply existing debounce logic (unchanged)
3. Call `processFileChange()` after debounce

**Fallback (No Git Extension):**
1. Only whitelist watchers active
2. Log warning to debug channel

### Configuration Changes

No new settings required. Existing settings continue to work:
- `sidecar.includeFiles`: Whitelist patterns (creates per-pattern watcher)
- `sidecar.fileWatchDebounceMs`: Applies to whitelist events only

## Test Scenarios

### UC-1: Track Git-Tracked File Changes
| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1.1 | Modify tracked file | Active session, git repository available | User modifies tracked file | `onDidChange` fires, file in `workingTreeChanges`, session notified |
| 1.2 | Stage file | Active session | User runs `git add` | `indexChanges` updated, session notified |
| 1.3 | Multiple files changed | Active session | Multiple files modified simultaneously | All processed in single `onDidChange` batch |
| 1.4 | Git revert | File was modified, then reverted | User runs `git checkout -- file` | File removed from changes, no duplicate processing |

### UC-2: Track Whitelisted File Changes
| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 2.1 | Modify whitelisted file | `sidecar.includeFiles` = `["dist/**"]` | User modifies `dist/bundle.js` | Watcher fires, debounced, session notified |
| 2.2 | Create whitelisted file | `sidecar.includeFiles` = `[".env.*"]` | User creates `.env.local` | Watcher fires, session notified |
| 2.3 | Rapid modifications | Whitelist file exists | User saves file 5 times in 100ms | Events coalesced via debounce |

### UC-3: Ignore Untracked Non-Whitelisted Files
| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 3.1 | Modify node_modules | node_modules in .gitignore | User modifies `node_modules/foo/bar.js` | NO event (no watcher) |
| 3.2 | Create system file | .DS_Store in .gitignore | User creates `.DS_Store` | NO event (no watcher) |
| 3.3 | Modify IDE config | .idea in .gitignore | User modifies `.idea/workspace.xml` | NO event (no watcher) |

### UC-4: Handle Git Extension Unavailable
| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 4.1 | Git extension disabled | User disabled vscode.git | Extension activates | Warning logged, whitelist-only mode active |
| 4.2 | No repository | Workspace folder without .git | Extension activates | Warning logged, whitelist-only mode active |
| 4.3 | Extension becomes available | Git extension was disabled, then enabled | User enables git extension | NOT re-enabled (requires reload) |

## Task List

| # | Task | Files | Description |
|---|------|-------|-------------|
| 1 | [Add Git Extension types](./task-1.md) | `src/types/git.d.ts` | Type definitions for Git Extension API |
| 2 | [Add Git Extension integration](./task-2.md) | `FileWatchController.ts` | Get Git API, find repository, subscribe to state changes |
| 3 | [Implement Git state change handler](./task-3.md) | `FileWatchController.ts` | Process workingTreeChanges + indexChanges |
| 4 | [Implement whitelist watchers](./task-4.md) | `FileWatchController.ts` | Replace global watcher with per-pattern watchers |
| 5 | [Add fallback behavior](./task-5.md) | `FileWatchController.ts` | Handle Git Extension unavailable gracefully |
| 6 | [Update reload and dispose](./task-6.md) | `FileWatchController.ts` | Clean up watchers, handle config changes |
| 7 | [Add unit tests](./task-7.md) | `FileWatchOptimization.test.ts` | Test git events, whitelist events, fallback |

## Dependencies

```
Task 1 (types)
    ↓
Task 2 (Git Extension integration)
    ↓
Task 3 (Git state handler)
    ↓
Task 4 (Whitelist watchers) ←── can run parallel after Task 2
    ↓
Task 5 (Fallback) ←── depends on Tasks 2-4
    ↓
Task 6 (Reload/Dispose)
    ↓
Task 7 (Unit tests) ←── after all implementation
```

## Success Criteria

- [ ] File watch events reduced by 90%+ in typical workspace
- [ ] Git-tracked file changes detected within 200ms
- [ ] Whitelisted file changes work with existing debounce
- [ ] No regression in session file tracking
- [ ] Fallback mode works without git extension
- [ ] Debug logs clearly identify event source (git vs whitelist)
- [ ] Memory usage reduced (fewer events in circular buffer)
- [ ] All existing tests pass
- [ ] New tests cover git and whitelist scenarios

## Rollback Plan

If issues arise:
1. Revert to previous `FileWatchController.ts` (single file)
2. Delete `src/types/git.d.ts`
3. The `'**/*'` watcher pattern is restored

## Migration Notes

- **Backwards Compatible**: No user action required
- **Setting Changes**: None
- **Behavior Changes**:
  - Untracked, non-whitelisted files no longer trigger any processing
  - This is the intended optimization, not a regression

## Critical Files

- `src/adapters/inbound/controllers/FileWatchController.ts` - Core implementation
- `src/types/git.d.ts` - New file: Git Extension API types
- `src/application/ports/outbound/SessionContext.ts` - Session notification interface (reference)
- `src/test/adapters/controllers/FileWatchDebounce.test.ts` - Existing test pattern
