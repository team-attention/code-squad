# Task 3: Implement Git State Change Handler

## Goal

Subscribe to repository state changes and process changed files.

## Files to Modify

- `src/adapters/inbound/controllers/FileWatchController.ts`

## Implementation

### 1. Add Class Member for Deduplication

```typescript
private lastProcessedChanges: Map<string, number> = new Map();
```

### 2. Add `setupGitStateWatcher()` Method

```typescript
private setupGitStateWatcher(context: vscode.ExtensionContext): void {
    if (!this.repository) return;

    this.repositoryStateSubscription = this.repository.state.onDidChange(() => {
        this.handleGitStateChange();
    });

    context.subscriptions.push(this.repositoryStateSubscription);
    this.log('Git state watcher subscribed');
}
```

### 3. Add `handleGitStateChange()` Method

```typescript
private async handleGitStateChange(): Promise<void> {
    if (!this.repository) return;

    const state = this.repository.state;
    const changes = [...state.workingTreeChanges, ...state.indexChanges];

    // Deduplicate by file path
    const uniqueChanges = new Map<string, Change>();
    for (const change of changes) {
        const fsPath = change.uri.fsPath;
        if (!uniqueChanges.has(fsPath)) {
            uniqueChanges.set(fsPath, change);
        }
    }

    if (uniqueChanges.size === 0) {
        return;
    }

    this.log(`Git state change: ${uniqueChanges.size} unique files`);

    // Process each changed file
    for (const [fsPath, change] of uniqueChanges) {
        // Skip if recently processed (dedup rapid git events)
        const now = Date.now();
        const lastProcessed = this.lastProcessedChanges.get(fsPath);
        if (lastProcessed && now - lastProcessed < 100) {
            continue;
        }
        this.lastProcessedChanges.set(fsPath, now);

        const relativePath = vscode.workspace.asRelativePath(change.uri);
        const fileName = path.basename(relativePath);

        this.eventCount++;
        this.eventCountWindow.push(now);

        this.log(`Git Event #${this.eventCount}: ${relativePath} (status=${Status[change.status]})`);
        this.logStats();

        // Process immediately (git already batches)
        this.pendingEvents++;
        this.maxPendingEvents = Math.max(this.maxPendingEvents, this.pendingEvents);
        try {
            await this.processFileChange({
                uri: change.uri,
                relativePath,
                fileName,
                timestamp: now
            });
        } finally {
            this.pendingEvents--;
        }
    }

    // Cleanup old entries from lastProcessedChanges (older than 5 seconds)
    const cutoff = Date.now() - 5000;
    for (const [filePath, timestamp] of this.lastProcessedChanges) {
        if (timestamp < cutoff) {
            this.lastProcessedChanges.delete(filePath);
        }
    }
}
```

### 4. Import Status Enum

Ensure `Status` enum is imported from types:

```typescript
import { GitExtension, GitAPI, Repository, Change, Status } from '../../../types/git';
```

## Test Scenarios

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 3.1 | Single file modified | Repository state watcher active | One file in workingTreeChanges | `processFileChange` called once |
| 3.2 | File in both changes | Same file in workingTreeChanges and indexChanges | `handleGitStateChange` called | Deduplicated, processed once |
| 3.3 | Multiple files | 5 files in workingTreeChanges | `handleGitStateChange` called | All 5 files processed |
| 3.4 | Rapid events | Same file changes twice in 50ms | Two `handleGitStateChange` calls | Second event skipped (100ms dedup) |
| 3.5 | No debounce | Git state changes | Events processed | Immediate processing, no debounce timer |
| 3.6 | Cleanup old entries | Entry older than 5s in map | Cleanup runs | Old entry removed |

## Acceptance Criteria

- [ ] Subscription created on repository state
- [ ] `workingTreeChanges` processed
- [ ] `indexChanges` processed
- [ ] Files deduplicated before processing
- [ ] No debounce applied (git batches internally)
- [ ] Recent duplicate events filtered (100ms window)
- [ ] Debug logs show git events with status
- [ ] Old dedup entries cleaned up
