# Task 6: Read configuration and pass to use case in ThreadListController

## Goal

Read `codeSquad.worktreeCopyPatterns` from VSCode configuration and pass to CreateThreadUseCase.

## Files to Modify

- `src/adapters/inbound/controllers/ThreadListController.ts`

## Implementation

Add helper method and update use case calls:

```typescript
private getWorktreeCopyPatterns(): string[] {
    const config = vscode.workspace.getConfiguration('codeSquad');
    return config.get<string[]>('worktreeCopyPatterns', []);
}
```

Update `createThreadFromInput`:
```typescript
private async createThreadFromInput(options: CreateThreadOptions): Promise<void> {
    // ... existing validation ...

    const result = await this.createThreadUseCase.execute({
        name: options.name.trim(),
        isolationMode: options.isolationMode,
        branchName: options.branchName?.trim(),
        worktreePath: options.worktreePath?.trim(),
        workspaceRoot,
        worktreeCopyPatterns: this.getWorktreeCopyPatterns(),  // NEW
    });

    // ... rest of method ...
}
```

Update `createThread`:
```typescript
async createThread(): Promise<void> {
    // ... existing flow ...

    const result = await this.createThreadUseCase.execute({
        name: name.trim(),
        isolationMode: isolationPick.mode,
        branchName: branchName?.trim(),
        workspaceRoot,
        worktreeCopyPatterns: this.getWorktreeCopyPatterns(),  // NEW
    });

    // ... rest of method ...
}
```

## Acceptance Criteria

- [ ] Helper method reads config from VSCode
- [ ] Patterns passed to CreateThreadUseCase in `createThreadFromInput`
- [ ] Patterns passed to CreateThreadUseCase in `createThread`
- [ ] Empty array passed if configuration not set
