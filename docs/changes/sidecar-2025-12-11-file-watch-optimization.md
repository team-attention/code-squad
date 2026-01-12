# Changes: File Watch Optimization

**Spec**: `docs/specs/sidecar-2025-12-11-file-watch-optimization.md`
**Plan**: `docs/plans/sidecar-2025-12-11-file-watch-optimization/main.md`
**Implemented**: 2025-12-11

## Summary

Replaced the global file system watcher pattern (`'**/*'`) with a hybrid approach using VSCode Git Extension API for git-tracked file changes and per-pattern FileSystemWatcher instances for whitelisted files.

## Changes

### Files Created

| File | Purpose |
|------|---------|
| `src/types/git.ts` | TypeScript type definitions for VSCode Git Extension API v1 |
| `src/test/adapters/controllers/FileWatchOptimization.test.ts` | Unit tests for git state handling, whitelist watchers, and fallback mode |

### Files Modified

| File | Changes |
|------|---------|
| `src/adapters/inbound/controllers/FileWatchController.ts` | Hybrid watcher implementation |

## Implementation Details

### New Class Members

```typescript
// Git Extension API
private gitAPI: GitAPI | undefined;
private repository: Repository | undefined;
private repositoryStateSubscription: vscode.Disposable | undefined;
private gitExtensionAvailable: boolean = false;
private lastProcessedChanges: Map<string, number> = new Map();
private whitelistWatchers: vscode.FileSystemWatcher[] = [];
private extensionContext: vscode.ExtensionContext | undefined;
```

### New Methods

| Method | Purpose |
|--------|---------|
| `initGitExtension()` | Initialize Git Extension API, find workspace repository |
| `setupGitStateWatcher()` | Subscribe to `repo.state.onDidChange` for file change events |
| `handleGitStateChange()` | Process `workingTreeChanges` + `indexChanges`, deduplicate |
| `setupWhitelistWatchers()` | Create per-pattern watchers using `RelativePattern` for `sidecar.includeFiles` |
| `disposeWhitelistWatchers()` | Clean up whitelist watchers |
| `handleWhitelistFileChange()` | Handle whitelist events with debounce |
| `getWatchMode()` | Return current watch mode (`'git+whitelist'` or `'whitelist-only'`) |

### Activation Flow

```
activate()
├── initGitExtension() [async]
│   ├── Get vscode.git extension
│   ├── Find workspace repository
│   └── setupGitStateWatcher() if repo found
├── setupWhitelistWatchers()
│   └── Create watcher for each includeFiles pattern
└── setupGitCommitWatcher()
```

### Event Flow

**Git-Tracked Files:**
1. `repo.state.onDidChange` fires (VSCode Git Extension)
2. Extract `workingTreeChanges` + `indexChanges`
3. Deduplicate by file path
4. Filter recently processed (100ms window)
5. Process immediately (no debounce - git batches internally)

**Whitelisted Files:**
1. Pattern-specific FileSystemWatcher with `RelativePattern` triggers
2. Apply debounce logic (default 300ms, configurable via `sidecar.fileWatchDebounceMs`)
3. Process after debounce fires

### Fallback Mode

When Git Extension is unavailable (disabled, no repository):
- `gitExtensionAvailable = false`
- Only whitelist watchers active
- Warning logged to debug channel
- Repository detected later via `onDidOpenRepository` listener

## Test Scenarios Covered

### UC-1: Git State Changes
- Process files from workingTreeChanges
- Process files from indexChanges
- Deduplicate files in both
- Skip recently processed (100ms window)
- No debounce for git events

### UC-2: Whitelist File Changes
- Create per-pattern watchers
- Apply debounce
- Coalesce rapid changes

### UC-3: Ignore Untracked Files
- Architecture ensures no events for untracked non-whitelisted files

### UC-4: Fallback Mode
- Work without git extension
- Work without repository
- Whitelist events work in fallback

## Breaking Changes

None. Fully backwards compatible.

## Migration Notes

- No user action required
- No settings changes
- Behavior change: Untracked, non-whitelisted files no longer trigger any processing (this is the intended optimization)

## Rollback Plan

1. Revert `FileWatchController.ts` to previous version
2. Delete `src/types/git.ts`
3. Delete test file
4. The `'**/*'` watcher pattern is restored

## Bug Fixes During Implementation

### RelativePattern for Whitelist Watchers

Initial implementation used plain glob patterns like `dist/**` for `createFileSystemWatcher()`. This didn't work because VSCode matches patterns against **full absolute paths** (e.g., `/Users/.../sidecar/dist/file.js`).

**Fix**: Use `vscode.RelativePattern(workspaceFolder, pattern)` to properly match workspace-relative paths.
