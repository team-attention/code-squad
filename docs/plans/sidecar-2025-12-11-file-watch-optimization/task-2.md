# Task 2: Add Git Extension Integration

## Goal

Initialize Git Extension API and find the workspace repository.

## Files to Modify

- `src/adapters/inbound/controllers/FileWatchController.ts`

## Implementation

### 1. Add Imports

```typescript
import { GitExtension, GitAPI, Repository, Change, Status } from '../../../types/git';
```

### 2. Add Class Members

```typescript
private gitAPI: GitAPI | undefined;
private repository: Repository | undefined;
private repositoryStateSubscription: vscode.Disposable | undefined;
private gitExtensionAvailable: boolean = false;
```

### 3. Add `initGitExtension()` Method

```typescript
private async initGitExtension(): Promise<void> {
    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');

    if (!gitExtension) {
        this.log('Git extension not found, using whitelist-only mode');
        return;
    }

    if (!gitExtension.isActive) {
        try {
            await gitExtension.activate();
        } catch (error) {
            this.log('Failed to activate git extension');
            this.logError('initGitExtension', error);
            return;
        }
    }

    this.gitAPI = gitExtension.exports.getAPI(1);

    if (!this.gitAPI) {
        this.log('Git API not available');
        return;
    }

    // Find repository for workspace
    this.repository = this.gitAPI.repositories.find(
        repo => repo.rootUri.fsPath === this.workspaceRoot
    );

    if (!this.repository) {
        this.log(`No git repository found for workspace: ${this.workspaceRoot}`);
        // Listen for repository to be opened later
        this.gitAPI.onDidOpenRepository(repo => {
            if (repo.rootUri.fsPath === this.workspaceRoot) {
                this.repository = repo;
                this.setupGitStateWatcher();
                this.log('Git repository found, enabled git-based file watching');
            }
        });
        return;
    }

    this.gitExtensionAvailable = true;
    this.log(`Git extension initialized, repository: ${this.repository.rootUri.fsPath}`);
}
```

### 4. Update `activate()` Method

Call `initGitExtension()` in the activation flow:

```typescript
activate(context: vscode.ExtensionContext): void {
    this.debugChannel = vscode.window.createOutputChannel('Sidecar FileWatch');
    context.subscriptions.push(this.debugChannel);

    // Initialize Git Extension (async, non-blocking)
    this.initGitExtension().then(() => {
        if (this.repository) {
            this.setupGitStateWatcher(context);
        }
        // Setup whitelist watchers (always, handled in task-4)
        this.setupWhitelistWatchers(context);
    });

    // ... rest of existing activation code ...
}
```

## Test Scenarios

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 2.1 | Git extension available | vscode.git extension installed | `initGitExtension()` called | `gitAPI` populated |
| 2.2 | Repository found | Git repository in workspace | `initGitExtension()` called | `repository` populated |
| 2.3 | No git extension | vscode.git not installed | `initGitExtension()` called | Warning logged, no crash |
| 2.4 | No repository | Workspace without .git | `initGitExtension()` called | Warning logged, listener setup |
| 2.5 | Repository opens later | Initially no repo | Repository opened | Repository detected, watcher setup |

## Acceptance Criteria

- [ ] Git extension acquired successfully
- [ ] Repository found for workspace root
- [ ] Handles missing git extension gracefully
- [ ] Handles missing repository gracefully
- [ ] Logs status to debug channel
- [ ] No blocking on extension activation
