# Spec: File Watch Optimization with Git Extension API

**Slug**: `sidecar-2025-12-11-file-watch-optimization`
**Created**: 2025-12-11

## Summary

Replace the global file system watcher pattern (`'**/*'`) with a hybrid approach that uses VSCode Git Extension API to detect git-tracked file changes and FileSystemWatcher only for whitelisted patterns. This optimization reduces resource usage (CPU, memory) by eliminating unnecessary file watch events for files Sidecar doesn't care about.

## Motivation

The current implementation uses `vscode.workspace.createFileSystemWatcher('**/*')`, which triggers on every file change in the workspace regardless of whether Sidecar needs to track it. This causes:

1. **High resource usage**: Memory and CPU overhead from processing all file events
2. **Heavy filtering overhead**: Every event requires debouncing, gitignore checking, and session validation
3. **Unnecessary processing**: Most workspaces contain files Sidecar never needs to track (node_modules, build artifacts, IDE files, etc.)

Since Sidecar's primary use case is reviewing AI-generated code changes, it only needs to track:
- Git-tracked files (files AI tools typically modify)
- Whitelisted files from `sidecar.includeFiles` setting (e.g., `dist/**`, `.env.*`)

## Use Cases

### UC-1: Track Git-Tracked File Changes

**Actor**: FileWatchController
**Trigger**: User modifies a file that is tracked by git
**Flow**:
1. VSCode Git Extension detects repository state change
2. FileWatchController receives `repo.state.onDidChange` event
3. Controller queries `repo.state.workingTreeChanges` and `repo.state.indexChanges`
4. Controller identifies modified files and notifies active sessions
5. Sessions update diff view for affected files

**Business Rules**:
- Only process files that appear in git working tree or index changes
- Skip files that are in `.gitignore` (unless whitelisted)
- Skip events if no active sessions exist

**Location**: `src/adapters/inbound/controllers/FileWatchController.ts`

### UC-2: Track Whitelisted File Changes

**Actor**: FileWatchController
**Trigger**: User modifies a file matching `sidecar.includeFiles` pattern
**Flow**:
1. FileSystemWatcher detects change for specific whitelist pattern
2. FileWatchController receives file change event
3. Controller verifies file matches whitelist pattern
4. Controller notifies active sessions with file change
5. Sessions update diff view for affected files

**Business Rules**:
- Only create FileSystemWatcher for patterns in `sidecar.includeFiles` setting
- Whitelist patterns typically match gitignored files (e.g., `dist/**`)
- Use debouncing for whitelist file events (existing behavior)

**Location**: `src/adapters/inbound/controllers/FileWatchController.ts`

### UC-3: Ignore Untracked Non-Whitelisted Files

**Actor**: FileWatchController
**Trigger**: User modifies a file that is neither git-tracked nor whitelisted
**Flow**:
1. No file watcher triggers (optimization)
2. File change is ignored
3. No session updates occur

**Business Rules**:
- Files not tracked by git and not in whitelist are not monitored
- This is the optimization - avoid creating watchers for these files

**Location**: N/A (handled by not creating watcher)

### UC-4: Handle Git Extension Unavailable

**Actor**: FileWatchController
**Trigger**: VSCode Git Extension is disabled or not available
**Flow**:
1. Controller attempts to get git extension on activation
2. Extension is not available
3. Controller logs warning message
4. Controller falls back to whitelist-only file watching
5. Only whitelisted files are tracked (degraded mode)

**Business Rules**:
- Git extension unavailability should not crash the extension
- Whitelist file watching should continue to work
- User should be notified via output channel

**Location**: `src/adapters/inbound/controllers/FileWatchController.ts`

## Requirements

### Functional Requirements

1. **Git Extension Integration**:
   - Get Git Extension API via `vscode.extensions.getExtension('vscode.git')`
   - Subscribe to repository state changes via `repo.state.onDidChange`
   - Query changed files from `repo.state.workingTreeChanges` and `repo.state.indexChanges`

2. **Whitelist File Watching**:
   - Create separate FileSystemWatcher for each pattern in `sidecar.includeFiles`
   - Apply debouncing to whitelist file events (existing behavior)
   - Reload watchers when `sidecar.includeFiles` configuration changes

3. **File Change Filtering**:
   - Skip gitignored files unless they match whitelist patterns
   - Skip directory changes
   - Skip changes when no active sessions exist

4. **Fallback Behavior**:
   - If Git Extension unavailable, only track whitelisted files
   - Log warning message to output channel

5. **Backwards Compatibility**:
   - Existing `sidecar.includeFiles` setting continues to work
   - Existing debounce configuration continues to work
   - Session notification behavior unchanged

### Non-Functional Requirements

1. **Performance**:
   - Reduce file watch events by 90%+ in typical workspace
   - Eliminate processing overhead for untracked files
   - Maintain sub-200ms response time for file changes

2. **Resource Usage**:
   - Reduce memory usage from circular event buffer
   - Reduce CPU usage from debounce timer management
   - Reduce peak pending events count

3. **Reliability**:
   - Handle git extension unavailability gracefully
   - Handle multiple workspace folders (use first folder)
   - Handle concurrent file changes correctly

4. **Observability**:
   - Log file watch method (git vs whitelist) in debug channel
   - Log git extension availability status
   - Maintain existing stats logging (events/sec, pending, processed)

## Technical Design

### Affected Components

| Component | Layer | Changes |
|-----------|-------|---------|
| `FileWatchController` | Adapters (Inbound) | Replace global watcher with git + whitelist hybrid |

### Implementation Approach

#### 1. Git Extension Integration

```typescript
interface GitExtension {
  getAPI(version: 1): GitAPI;
}

interface GitAPI {
  repositories: Repository[];
  onDidOpenRepository: Event<Repository>;
  onDidCloseRepository: Event<Repository>;
}

interface Repository {
  rootUri: Uri;
  state: RepositoryState;
}

interface RepositoryState {
  workingTreeChanges: Change[];
  indexChanges: Change[];
  onDidChange: Event<void>;
}

interface Change {
  uri: Uri;
  status: Status;
}
```

#### 2. Watcher Setup

```typescript
class FileWatchController {
  private gitExtension: GitAPI | undefined;
  private repository: Repository | undefined;
  private whitelistWatchers: vscode.FileSystemWatcher[] = [];

  async activate(context: vscode.ExtensionContext): Promise<void> {
    // 1. Get Git Extension
    const gitExt = vscode.extensions.getExtension<GitExtension>('vscode.git');
    if (gitExt) {
      this.gitExtension = gitExt.exports.getAPI(1);
      this.setupGitWatcher(context);
    } else {
      this.log('⚠️ Git extension not available, using whitelist-only mode');
    }

    // 2. Setup whitelist watchers
    this.setupWhitelistWatchers(context);
  }

  private setupGitWatcher(context: vscode.ExtensionContext): void {
    if (!this.gitExtension || !this.workspaceRoot) return;

    // Get repository for workspace
    this.repository = this.gitExtension.repositories.find(
      repo => repo.rootUri.fsPath === this.workspaceRoot
    );

    if (!this.repository) {
      this.log('⚠️ No git repository found for workspace');
      return;
    }

    // Subscribe to repository state changes
    context.subscriptions.push(
      this.repository.state.onDidChange(() => {
        this.handleGitStateChange();
      })
    );
  }

  private setupWhitelistWatchers(context: vscode.ExtensionContext): void {
    const config = vscode.workspace.getConfiguration('sidecar');
    const includeFiles = config.get<string[]>('includeFiles', []);

    // Clear existing watchers
    this.whitelistWatchers.forEach(w => w.dispose());
    this.whitelistWatchers = [];

    // Create watcher for each pattern
    for (const pattern of includeFiles) {
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);
      this.whitelistWatchers.push(watcher);

      context.subscriptions.push(watcher);
      context.subscriptions.push(watcher.onDidChange(this.handleWhitelistChange));
      context.subscriptions.push(watcher.onDidCreate(this.handleWhitelistChange));
    }
  }
}
```

#### 3. Event Handling

```typescript
private async handleGitStateChange(): Promise<void> {
  if (!this.repository) return;

  const changes = [
    ...this.repository.state.workingTreeChanges,
    ...this.repository.state.indexChanges
  ];

  // Deduplicate by URI
  const uniqueChanges = new Map<string, Change>();
  for (const change of changes) {
    uniqueChanges.set(change.uri.fsPath, change);
  }

  // Process each changed file
  for (const [_, change] of uniqueChanges) {
    this.eventCount++;
    this.eventCountWindow.push(Date.now());

    const relativePath = vscode.workspace.asRelativePath(change.uri);
    this.log(`📁 Git Event #${this.eventCount}: ${relativePath}`);

    // Process immediately (no debounce for git events)
    await this.processFileChange({
      uri: change.uri,
      relativePath,
      fileName: path.basename(relativePath),
      timestamp: Date.now()
    });
  }
}

private async handleWhitelistChange(uri: vscode.Uri): Promise<void> {
  const relativePath = vscode.workspace.asRelativePath(uri);
  const fileName = path.basename(relativePath);

  this.eventCount++;
  this.eventCountWindow.push(Date.now());

  this.log(`📁 Whitelist Event #${this.eventCount}: ${relativePath}`);

  // Apply debouncing for whitelist files
  if (this.debounceMs === 0) {
    await this.processFileChange({ uri, relativePath, fileName, timestamp: Date.now() });
  } else {
    // Existing debounce logic
    this.scheduleDebounce(relativePath, { uri, relativePath, fileName, timestamp: Date.now() });
  }
}
```

### Migration Strategy

1. **Phase 1**: Add git extension integration alongside existing global watcher
2. **Phase 2**: Test with both watchers active, compare event counts
3. **Phase 3**: Remove global watcher, keep only git + whitelist

### Backwards Compatibility

- Existing `sidecar.includeFiles` configuration works unchanged
- Existing `sidecar.fileWatchDebounceMs` applies to whitelist files
- If git extension unavailable, falls back to whitelist-only mode

## Success Criteria

1. File watch events reduced by 90%+ in typical workspace (1000+ files)
2. Git-tracked file changes detected within 200ms
3. Whitelisted file changes detected and debounced correctly
4. No regression in existing file tracking functionality
5. Memory usage reduced (fewer events in circular buffer)
6. Debug logs clearly indicate git vs whitelist events

## Out of Scope

- Multi-folder workspace support (only first workspace folder)
- Submodule handling (git extension handles this)
- Custom git executable configuration
- File watch event priority/ordering guarantees
- Real-time git diff computation (use existing git port)
siㄴㄴ