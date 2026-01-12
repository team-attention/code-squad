# Task 2: Fix File Status Detection

**Requirement**: R1.1
**Layer**: Adapters (Inbound + Outbound)
**Dependencies**: None

## Goal

Fix the bug where all files show as "Modified" regardless of actual git status. Detect actual file state: `added`, `modified`, `deleted`.

## Bug Analysis

### Current Code (AIDetectionController.ts:170-174)

```typescript
const baselineFiles: FileInfo[] = Array.from(allPaths).map((filePath) => ({
    path: filePath,
    name: path.basename(filePath),
    status: 'modified' as const,  // ← BUG: Always hardcoded
}));
```

### Current Code (FileWatchController.ts:114-118)

```typescript
this.panelStateManager.addSessionFile({
    path: relativePath,
    name: fileName,
    status: 'modified',  // ← BUG: Always hardcoded
});
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/application/ports/outbound/IGitPort.ts` | Add `getFileStatus()` method |
| `src/adapters/outbound/gateways/VscodeGitGateway.ts` | Implement `getFileStatus()` |
| `src/adapters/inbound/controllers/AIDetectionController.ts` | Use actual git status |
| `src/adapters/inbound/controllers/FileWatchController.ts` | Use actual git status |

## Implementation Steps

### Step 1: Extend IGitPort Interface

```typescript
// src/application/ports/outbound/IGitPort.ts
export type FileStatus = 'added' | 'modified' | 'deleted';

export interface IGitPort {
    getDiff(workspaceRoot: string, relativePath: string): Promise<string>;
    isGitRepository(workspaceRoot: string): Promise<boolean>;
    getUncommittedFiles(workspaceRoot: string): Promise<string[]>;
    getFileStatus(workspaceRoot: string, relativePath: string): Promise<FileStatus>;  // NEW
    getUncommittedFilesWithStatus(workspaceRoot: string): Promise<Array<{ path: string; status: FileStatus }>>;  // NEW
}
```

### Step 2: Implement in VscodeGitGateway

```typescript
// src/adapters/outbound/gateways/VscodeGitGateway.ts

async getFileStatus(workspaceRoot: string, relativePath: string): Promise<FileStatus> {
    return new Promise((resolve) => {
        exec(
            `cd "${workspaceRoot}" && git status --porcelain -- "${relativePath}"`,
            { maxBuffer: 1024 * 1024 },
            (error, stdout) => {
                if (error || !stdout.trim()) {
                    resolve('modified');  // fallback
                    return;
                }
                const statusCode = stdout.substring(0, 2);
                // Git status codes:
                // A  = added (staged)
                // ?? = untracked (new file)
                // M  = modified
                // D  = deleted
                if (statusCode.includes('A') || statusCode === '??') {
                    resolve('added');
                } else if (statusCode.includes('D')) {
                    resolve('deleted');
                } else {
                    resolve('modified');
                }
            }
        );
    });
}

async getUncommittedFilesWithStatus(workspaceRoot: string): Promise<Array<{ path: string; status: FileStatus }>> {
    const isGit = await this.isGitRepository(workspaceRoot);
    if (!isGit) return [];

    return new Promise((resolve) => {
        exec(
            `cd "${workspaceRoot}" && git status --porcelain`,
            { maxBuffer: 1024 * 1024 },
            (error, stdout) => {
                if (error) {
                    resolve([]);
                    return;
                }

                const files = stdout
                    .split('\n')
                    .filter((line) => line.trim())
                    .map((line) => {
                        const statusCode = line.substring(0, 2);
                        const filePath = line.substring(3).trim();
                        let status: FileStatus = 'modified';
                        if (statusCode.includes('A') || statusCode === '??') {
                            status = 'added';
                        } else if (statusCode.includes('D')) {
                            status = 'deleted';
                        }
                        return { path: filePath, status };
                    })
                    .filter((f) => f.path.length > 0);

                resolve(files);
            }
        );
    });
}
```

### Step 3: Update AIDetectionController

```typescript
// In captureBaseline method
private async captureBaseline(workspaceRoot: string): Promise<void> {
    try {
        const config = vscode.workspace.getConfiguration('sidecar');
        const includePatterns = config.get<string[]>('includeFiles', []);

        // Get git files WITH status
        const gitFilesWithStatus = await this.gitPort.getUncommittedFilesWithStatus(workspaceRoot);

        let configFiles: string[] = [];
        if (includePatterns.length > 0) {
            const globResults = await Promise.all(
                includePatterns.map((pattern) => this.fileGlobber.glob(pattern, workspaceRoot))
            );
            const absolutePaths = globResults.flat();
            configFiles = absolutePaths.map((absPath) =>
                path.relative(workspaceRoot, absPath)
            );
        }

        // Create map for quick status lookup
        const statusMap = new Map(gitFilesWithStatus.map(f => [f.path, f.status]));

        const allPaths = new Set([
            ...gitFilesWithStatus.map(f => f.path),
            ...configFiles
        ]);

        const baselineFiles: FileInfo[] = Array.from(allPaths).map((filePath) => ({
            path: filePath,
            name: path.basename(filePath),
            status: statusMap.get(filePath) || 'modified',
        }));

        this.panelStateManager!.setBaseline(baselineFiles);
    } catch (error) {
        console.error('Failed to capture baseline:', error);
    }
}
```

### Step 4: Update FileWatchController

```typescript
// Inject gitPort in constructor
constructor(private readonly gitPort?: IGitPort) {
    // ...
}

// In handleFileChange
const handleFileChange = async (uri: vscode.Uri) => {
    // ... existing checks ...

    if (this.panelStateManager) {
        const relativePath = vscode.workspace.asRelativePath(uri);
        const fileName = path.basename(relativePath);

        // Get actual status from git
        let status: FileStatus = 'modified';
        if (this.gitPort && this.workspaceRoot) {
            status = await this.gitPort.getFileStatus(this.workspaceRoot, relativePath);
        }

        // ... rest of the logic using actual status ...
    }
};
```

## Validation

```bash
npm run compile
# Manual test: Create new file → should show 'A' badge
# Manual test: Modify existing file → should show 'M' badge
# Manual test: Delete file → should show 'D' badge
```

## Architecture Compliance

- IGitPort is in Application layer (ports/outbound) ✓
- VscodeGitGateway is in Adapters layer (outbound/gateways) ✓
- Controllers use port interface, not concrete implementation ✓
