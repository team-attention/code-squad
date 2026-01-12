# Task 4: Call removeFile() on Empty Diff

## Goal

When GenerateDiffUseCase produces empty diff, remove file from list instead of showing empty diff.

## File

`src/application/useCases/GenerateDiffUseCase.ts`

## Implementation

Modify `execute()` method:

```typescript
async execute(relativePath: string): Promise<void> {
    const workspaceRoot = this.fileSystemPort.getWorkspaceRoot();
    if (!workspaceRoot) return;

    let diff = '';

    if (this.snapshotRepository.has(relativePath)) {
        diff = await this.generateSnapshotDiff(relativePath);
    } else {
        diff = await this.gitPort.getDiff(workspaceRoot, relativePath);
    }

    // NEW: Remove file if diff is empty
    if (!diff || diff.trim() === '') {
        this.panelPort.removeFile(relativePath);
        return;
    }

    this.panelPort.postDiff(relativePath, diff);
}
```

## Acceptance Criteria

- [ ] Empty diff triggers `removeFile()` instead of `postDiff()`
- [ ] File with reverted changes is removed from list when clicked
