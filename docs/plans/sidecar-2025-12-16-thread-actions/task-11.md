# Task 11: ThreadListController - Add Action Handlers

## Goal

Add handlers for deleteThread, renameThread, and switchThreadBranch actions.

## Location

`src/adapters/inbound/controllers/ThreadListController.ts`

## Changes

### New Methods

```typescript
/**
 * Delete a thread with confirmation dialog.
 */
async deleteThread(threadId: string): Promise<void> {
  // 1. Get thread info for confirmation
  const thread = await this.threadStateRepository.findById(threadId);
  if (!thread) return;

  // 2. Show confirmation dialog
  const options: vscode.MessageItem[] = [
    { title: 'Delete Thread Only' },
    { title: 'Delete All (incl. Terminal/Worktree)' },
    { title: 'Cancel', isCloseAffordance: true }
  ];

  const result = await vscode.window.showWarningMessage(
    `Delete thread "${thread.name}"?`,
    { modal: true },
    ...options
  );

  if (!result || result.title === 'Cancel') return;

  // 3. Execute deletion
  const deleteAll = result.title === 'Delete All (incl. Terminal/Worktree)';
  await this.deleteThreadUseCase.execute({
    threadId,
    workspaceRoot: this.workspaceRoot,
    closeTerminal: deleteAll,
    removeWorktree: deleteAll
  });

  // 4. Handle selection if deleted thread was selected
  if (this.selectedThreadId === threadId) {
    await this.selectNextThread();
  }

  // 5. Refresh UI
  await this.refresh();
}

/**
 * Rename a thread with input dialog.
 */
async renameThread(threadId: string): Promise<void> {
  const thread = await this.threadStateRepository.findById(threadId);
  if (!thread) return;

  const newName = await vscode.window.showInputBox({
    prompt: 'Enter new thread name',
    value: thread.name,
    validateInput: (value) => {
      if (!value || value.length === 0) return 'Name cannot be empty';
      if (value.length > 50) return 'Name cannot exceed 50 characters';
      return null;
    }
  });

  if (!newName || newName === thread.name) return;

  await this.renameThreadUseCase.execute({ threadId, newName });
  await this.refresh();
}

/**
 * Switch branch for a worktree thread with quick pick.
 */
async switchThreadBranch(threadId: string): Promise<void> {
  const thread = await this.threadStateRepository.findById(threadId);
  if (!thread || !thread.worktreePath) {
    vscode.window.showErrorMessage('Branch switching only available for worktree threads');
    return;
  }

  // 1. Get available branches
  const branches = await this.gitPort.listBranches(this.workspaceRoot);

  // 2. Show quick pick
  const selected = await vscode.window.showQuickPick(branches, {
    placeHolder: 'Select branch to switch to',
    title: `Switch branch for "${thread.name}"`
  });

  if (!selected || selected === thread.branch) return;

  // 3. Check for uncommitted changes
  const hasChanges = await this.gitPort.hasUncommittedChanges(thread.worktreePath);

  let stashChanges = true;
  if (hasChanges) {
    const stashResult = await vscode.window.showWarningMessage(
      'Uncommitted changes detected. Stash changes before switching?',
      { modal: true },
      'Stash and Switch',
      'Cancel'
    );
    if (stashResult !== 'Stash and Switch') return;
  }

  // 4. Execute switch
  await this.switchThreadBranchUseCase.execute({
    threadId,
    targetBranch: selected,
    stashChanges
  });

  await this.refresh();
  vscode.window.showInformationMessage(`Switched to branch "${selected}"`);
}

/**
 * Select next available thread after deletion.
 */
private async selectNextThread(): Promise<void> {
  const threads = await this.threadStateRepository.findAll();
  if (threads.length > 0) {
    await this.selectThread(threads[0].threadId);
  } else {
    this.selectedThreadId = null;
    // Clear Code Squad panel or show empty state
  }
}
```

### Constructor Changes

Add new use case dependencies:

```typescript
constructor(
  // ... existing deps
  private readonly deleteThreadUseCase: IDeleteThreadUseCase,
  private readonly renameThreadUseCase: IRenameThreadUseCase,
  private readonly switchThreadBranchUseCase: ISwitchThreadBranchUseCase,
  private readonly gitPort: IGitPort
) {}
```

## Test Scenarios

Controller tests are typically integration-style. Key behaviors to verify:

### TC1: Delete thread shows confirmation
- **When**: `deleteThread("t1")` called
- **Then**: Confirmation dialog shown with options

### TC2: Delete cancelled
- **When**: User cancels delete confirmation
- **Then**: No deletion occurs

### TC3: Delete thread only
- **When**: User selects "Delete Thread Only"
- **Then**: UseCase called with closeTerminal=false, removeWorktree=false

### TC4: Delete all
- **When**: User selects "Delete All"
- **Then**: UseCase called with closeTerminal=true, removeWorktree=true

### TC5: Rename shows input box
- **When**: `renameThread("t1")` called
- **Then**: Input box shown with current name

### TC6: Rename cancelled
- **When**: User cancels input box
- **Then**: No rename occurs

### TC7: Switch branch shows quick pick
- **When**: `switchThreadBranch("t1")` called for worktree thread
- **Then**: Quick pick shown with branch list

### TC8: Switch branch error for non-worktree
- **When**: `switchThreadBranch("t1")` called for local thread
- **Then**: Error message shown

## Dependencies

- Task 8 (DeleteThreadUseCase)
- Task 9 (RenameThreadUseCase)
- Task 10 (SwitchThreadBranchUseCase)
