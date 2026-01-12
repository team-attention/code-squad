# Task 4: Implement Whitelist Watchers

## Goal

Replace global `'**/*'` watcher with per-pattern watchers for whitelisted files.

## Files to Modify

- `src/adapters/inbound/controllers/FileWatchController.ts`

## Implementation

### 1. Add Whitelist Watcher Member

```typescript
private whitelistWatchers: vscode.FileSystemWatcher[] = [];
```

### 2. Add `setupWhitelistWatchers()` Method

```typescript
private setupWhitelistWatchers(context: vscode.ExtensionContext): void {
    // Clear existing watchers
    this.disposeWhitelistWatchers();

    const config = vscode.workspace.getConfiguration('sidecar');
    const includeFiles = config.get<string[]>('includeFiles', []);

    if (includeFiles.length === 0) {
        this.log('No whitelist patterns configured');
        return;
    }

    this.log(`Setting up ${includeFiles.length} whitelist watcher(s)`);

    for (const pattern of includeFiles) {
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);
        this.whitelistWatchers.push(watcher);

        const handleWhitelistChange = (uri: vscode.Uri) => {
            this.handleWhitelistFileChange(uri);
        };

        context.subscriptions.push(watcher);
        context.subscriptions.push(watcher.onDidChange(handleWhitelistChange));
        context.subscriptions.push(watcher.onDidCreate(handleWhitelistChange));

        this.log(`Whitelist watcher created: ${pattern}`);
    }
}
```

### 3. Add `disposeWhitelistWatchers()` Method

```typescript
private disposeWhitelistWatchers(): void {
    for (const watcher of this.whitelistWatchers) {
        watcher.dispose();
    }
    this.whitelistWatchers = [];
}
```

### 4. Add `handleWhitelistFileChange()` Method

```typescript
private handleWhitelistFileChange(uri: vscode.Uri): void {
    const relativePath = vscode.workspace.asRelativePath(uri);
    const fileName = path.basename(relativePath);

    this.eventCount++;
    this.eventCountWindow.push(Date.now());

    this.log(`Whitelist Event #${this.eventCount}: ${relativePath}`);
    this.logStats();

    // Apply debouncing for whitelist files (unchanged behavior)
    if (this.debounceMs === 0) {
        this.pendingEvents++;
        this.maxPendingEvents = Math.max(this.maxPendingEvents, this.pendingEvents);
        this.processFileChange({ uri, relativePath, fileName, timestamp: Date.now() })
            .finally(() => this.pendingEvents--);
        return;
    }

    // Existing debounce logic
    const existingTimer = this.debounceTimers.get(relativePath);
    if (existingTimer) {
        clearTimeout(existingTimer);
        this.log(`[Debounce] Coalesced: ${relativePath}`);
    } else {
        this.log(`[Debounce] Scheduled: ${relativePath} (delay=${this.debounceMs}ms)`);
    }

    this.pendingEventData.set(relativePath, {
        uri,
        relativePath,
        fileName,
        timestamp: Date.now()
    });

    const timer = setTimeout(async () => {
        const eventData = this.pendingEventData.get(relativePath);
        this.debounceTimers.delete(relativePath);
        this.pendingEventData.delete(relativePath);

        if (eventData) {
            this.log(`[Debounce] Fired: ${relativePath} (pending=${this.debounceTimers.size})`);
            this.pendingEvents++;
            this.maxPendingEvents = Math.max(this.maxPendingEvents, this.pendingEvents);
            try {
                await this.processFileChange(eventData);
            } finally {
                this.pendingEvents--;
            }
        }
    }, this.debounceMs);

    this.debounceTimers.set(relativePath, timer);
}
```

### 5. Remove Global Watcher

In `activate()` method, **remove** the global watcher:

```typescript
// REMOVE these lines:
// const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');
// context.subscriptions.push(fileWatcher);
// context.subscriptions.push(fileWatcher.onDidChange(handleFileChange));
// context.subscriptions.push(fileWatcher.onDidCreate(handleFileChange));
```

## Test Scenarios

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 4.1 | Single pattern | `includeFiles = ["dist/**"]` | `setupWhitelistWatchers` called | One watcher created |
| 4.2 | Multiple patterns | `includeFiles = ["dist/**", ".env.*"]` | `setupWhitelistWatchers` called | Two watchers created |
| 4.3 | No patterns | `includeFiles = []` | `setupWhitelistWatchers` called | No watchers, log message |
| 4.4 | Whitelist change | File matching pattern modified | Watcher fires | Debounce logic applied |
| 4.5 | No debounce | `debounceMs = 0`, whitelist file changes | Event received | Immediate processing |
| 4.6 | Rapid changes | Same whitelist file modified 3 times quickly | 3 events | Events coalesced |
| 4.7 | Global watcher removed | Code updated | Compile and run | No `'**/*'` watcher |

## Acceptance Criteria

- [ ] Global `'**/*'` watcher removed
- [ ] Per-pattern watcher created for each `sidecar.includeFiles` entry
- [ ] Whitelist events use existing debounce logic
- [ ] Debug logs distinguish whitelist events
- [ ] Handles empty `includeFiles` array
- [ ] Watchers properly disposed
