# Task 5: Check Baseline in File Change Handler

## Goal

When a file changes, check if it's in the baseline. If so, move it to session files.

## Dependencies

- Task 3 (PanelStateManager baseline methods)

## Files to Modify

1. `src/adapters/inbound/controllers/FileWatchController.ts`

## Implementation

### FileWatchController.ts

Update the file change handler to check baseline:

```typescript
const handleFileChange = async (uri: vscode.Uri) => {
    try {
        const stat = await vscode.workspace.fs.stat(uri);
        if (stat.type === vscode.FileType.Directory) {
            return;
        }
    } catch {
        return;
    }

    if (!this.shouldTrack(uri)) return;

    if (this.panelStateManager) {
        const relativePath = vscode.workspace.asRelativePath(uri);
        const fileName = path.basename(relativePath);
        const currentState = this.panelStateManager.getState();

        // Check if file is in baseline
        if (this.panelStateManager.isInBaseline(relativePath)) {
            // Move from baseline to session files
            this.panelStateManager.moveToSession(relativePath);
        } else {
            // Check if already in session files
            const existsInSession = currentState.sessionFiles.some(f => f.path === relativePath);
            if (!existsInSession) {
                // Add to session files
                this.panelStateManager.addSessionFile({
                    path: relativePath,
                    name: fileName,
                    status: 'modified',
                });
            }
        }

        // Auto-generate diff logic (updated for sessionFiles)
        const isFirstFile = currentState.sessionFiles.length === 0 &&
                           !this.panelStateManager.isInBaseline(relativePath);
        const isSelectedFile = currentState.selectedFile === relativePath;

        if (this.generateDiffUseCase && (isFirstFile || isSelectedFile)) {
            await this.generateDiffUseCase.execute(relativePath);
        }
    }
};
```

## Logic Flow

```
File Changed
    │
    ├─► Is in baseline?
    │       │
    │       ├─ Yes → moveToSession(path)
    │       │         - Removes from uncommittedFiles
    │       │         - Adds to sessionFiles
    │       │
    │       └─ No → Is in sessionFiles?
    │               │
    │               ├─ Yes → No action (already tracked)
    │               │
    │               └─ No → addSessionFile(file)
    │
    └─► Auto-generate diff if needed
```

## Validation

- [ ] Baseline files are moved to session when modified
- [ ] Non-baseline files are added to session files
- [ ] Already tracked files are not duplicated
- [ ] Auto-diff generation still works
