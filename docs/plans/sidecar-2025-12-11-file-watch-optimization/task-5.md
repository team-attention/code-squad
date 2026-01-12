# Task 5: Add Fallback Behavior

## Goal

Handle cases where Git Extension is unavailable gracefully.

## Files to Modify

- `src/adapters/inbound/controllers/FileWatchController.ts`

## Implementation

### 1. Update `initGitExtension()` to Set Status Flag

The `gitExtensionAvailable` flag was added in Task 2. Ensure all failure paths set it to false:

```typescript
private async initGitExtension(): Promise<void> {
    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');

    if (!gitExtension) {
        this.gitExtensionAvailable = false;
        this.log('⚠️ Git extension not found, using whitelist-only mode');
        return;
    }

    if (!gitExtension.isActive) {
        try {
            await gitExtension.activate();
        } catch (error) {
            this.gitExtensionAvailable = false;
            this.log('⚠️ Failed to activate git extension, using whitelist-only mode');
            this.logError('initGitExtension', error);
            return;
        }
    }

    this.gitAPI = gitExtension.exports.getAPI(1);

    if (!this.gitAPI) {
        this.gitExtensionAvailable = false;
        this.log('⚠️ Git API not available, using whitelist-only mode');
        return;
    }

    // Find repository for workspace
    this.repository = this.gitAPI.repositories.find(
        repo => repo.rootUri.fsPath === this.workspaceRoot
    );

    if (!this.repository) {
        this.gitExtensionAvailable = false;
        this.log(`⚠️ No git repository found for: ${this.workspaceRoot}`);
        this.log('Using whitelist-only mode');
        // Still listen for repository to be opened
        this.gitAPI.onDidOpenRepository(repo => {
            if (repo.rootUri.fsPath === this.workspaceRoot) {
                this.repository = repo;
                this.gitExtensionAvailable = true;
                this.setupGitStateWatcher();
                this.log('✓ Git repository detected, enabled git-based file watching');
            }
        });
        return;
    }

    this.gitExtensionAvailable = true;
    this.log(`✓ Git extension initialized: ${this.repository.rootUri.fsPath}`);
}
```

### 2. Update `logStats()` to Show Mode

Add mode indicator to stats logging:

```typescript
private logStats(): void {
    // ... existing stats calculation ...

    const mode = this.gitExtensionAvailable ? 'git+whitelist' : 'whitelist-only';
    this.log(
        `[Stats] rate=${eventsPerSecond.toFixed(1)}/s, ` +
        `pending=${this.pendingEvents}, ` +
        `maxPending=${this.maxPendingEvents}, ` +
        `total=${this.eventCount}, ` +
        `mode=${mode}`
    );
}
```

### 3. Simplify `processFileChange()` Filtering

Since git-tracked files come from git extension and whitelist files come from pattern matchers, the `shouldTrack()` check can be simplified:

```typescript
private async processFileChange(data: DebouncedEventData): Promise<void> {
    // Check file exists
    try {
        const stat = await vscode.workspace.fs.stat(data.uri);
        if (stat.type === vscode.FileType.Directory) {
            this.log(`  Skip: directory`);
            return;
        }
    } catch {
        this.log(`  Skip: file not found or inaccessible`);
        return;
    }

    // Skip internal/excluded files
    if (data.relativePath.includes('sidecar-comments.json') ||
        data.relativePath.startsWith('.git/') ||
        data.relativePath.startsWith('.git\\')) {
        this.log(`  Skip: excluded file`);
        return;
    }

    // For git mode: files already filtered by git
    // For whitelist mode: files already match patterns
    // No need for shouldTrack() check here

    // ... rest of session notification logic ...
}
```

### 4. Add Method to Get Current Mode

```typescript
getWatchMode(): 'git+whitelist' | 'whitelist-only' {
    return this.gitExtensionAvailable ? 'git+whitelist' : 'whitelist-only';
}
```

## Test Scenarios

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 5.1 | No git extension | vscode.git not installed | Extension activates | `gitExtensionAvailable = false`, warning logged |
| 5.2 | Git activation fails | vscode.git throws on activate | Extension activates | Fallback to whitelist-only |
| 5.3 | No repository | Workspace without .git | Extension activates | Fallback to whitelist-only |
| 5.4 | Mode in stats | Any mode | `logStats()` called | Mode shown in log |
| 5.5 | Repository opens later | Initially no repo | User initializes git | `gitExtensionAvailable` becomes true |
| 5.6 | Whitelist works in fallback | No git, whitelist configured | Whitelist file changes | Events processed normally |

## Acceptance Criteria

- [ ] Warning logged when git extension unavailable
- [ ] Whitelist watchers still work in fallback mode
- [ ] No crash on missing git extension
- [ ] Debug logs indicate current mode
- [ ] `shouldTrack()` overhead removed for valid events
- [ ] Mode can be queried via `getWatchMode()`
