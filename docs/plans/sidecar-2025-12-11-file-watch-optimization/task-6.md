# Task 6: Update Reload and Dispose

## Goal

Properly clean up resources and handle configuration changes.

## Files to Modify

- `src/adapters/inbound/controllers/FileWatchController.ts`

## Implementation

### 1. Store Context Reference

Add class member to store context for config change handling:

```typescript
private extensionContext: vscode.ExtensionContext | undefined;
```

Set it in `activate()`:

```typescript
activate(context: vscode.ExtensionContext): void {
    this.extensionContext = context;
    // ... rest of activation
}
```

### 2. Update `reload()` Method

```typescript
reload(): void {
    this.gitignore = ignore();
    this.includePatterns = ignore();

    this.initialize();

    // Re-setup whitelist watchers if context available
    if (this.extensionContext) {
        this.setupWhitelistWatchers(this.extensionContext);
    }

    this.log('FileWatchController reloaded');
}
```

### 3. Update `dispose()` Method

```typescript
dispose(): void {
    const timerCount = this.debounceTimers.size;

    // Clear debounce timers
    for (const [filePath, timer] of this.debounceTimers) {
        clearTimeout(timer);
        this.log(`[Debounce] Cleanup: ${filePath}`);
    }
    this.debounceTimers.clear();
    this.pendingEventData.clear();

    // Dispose whitelist watchers
    this.disposeWhitelistWatchers();

    // Clear git state tracking
    this.lastProcessedChanges.clear();

    // Clear git references (subscriptions auto-disposed via context)
    this.gitAPI = undefined;
    this.repository = undefined;
    this.gitExtensionAvailable = false;

    if (timerCount > 0) {
        this.log(`Disposed: cleared ${timerCount} pending debounce timers`);
    }

    this.log('FileWatchController disposed');
}
```

### 4. Update Config Change Handler

In `activate()`, update the configuration change handler:

```typescript
context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('sidecar.includeFiles')) {
            this.log('includeFiles configuration changed');
            this.loadIncludePatterns();
            this.setupWhitelistWatchers(context);
        }
        if (e.affectsConfiguration('sidecar.fileWatchDebounceMs')) {
            this.log('fileWatchDebounceMs configuration changed');
            this.loadDebounceConfig();
        }
    })
);
```

### 5. Ensure Clean Subscription Management

The whitelist watchers need careful management since they're disposed and recreated:

```typescript
private setupWhitelistWatchers(context: vscode.ExtensionContext): void {
    // First dispose existing
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

        // Note: These handlers are bound to current watcher instance
        // They'll be cleaned up when disposeWhitelistWatchers() is called
        const onChange = watcher.onDidChange(uri => this.handleWhitelistFileChange(uri));
        const onCreate = watcher.onDidCreate(uri => this.handleWhitelistFileChange(uri));

        // Add to context subscriptions for extension cleanup
        context.subscriptions.push(watcher);
        context.subscriptions.push(onChange);
        context.subscriptions.push(onCreate);

        this.log(`Whitelist watcher created: ${pattern}`);
    }
}

private disposeWhitelistWatchers(): void {
    const count = this.whitelistWatchers.length;
    for (const watcher of this.whitelistWatchers) {
        watcher.dispose();
    }
    this.whitelistWatchers = [];
    if (count > 0) {
        this.log(`Disposed ${count} whitelist watcher(s)`);
    }
}
```

## Test Scenarios

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 6.1 | Config change | Active watchers | `includeFiles` changed | Old watchers disposed, new created |
| 6.2 | Extension deactivate | Active watchers, timers | Extension deactivates | All resources cleaned |
| 6.3 | Reload | Active watchers | `reload()` called | Watchers recreated |
| 6.4 | No memory leaks | Config changed 10 times | Check watcher count | Always matches pattern count |
| 6.5 | Debounce config change | Active debounce | `fileWatchDebounceMs` changed | New value used |

## Acceptance Criteria

- [ ] Whitelist watchers disposed on deactivation
- [ ] Config change reloads whitelist watchers
- [ ] No memory leaks from old watchers
- [ ] Debug state maps cleared
- [ ] Git references cleared on dispose
- [ ] Reload works correctly
- [ ] All pending timers cleared
