# Task 7: Add "New Agent" Button and Quick Pick Flow

## Scope

Add UI for creating new threads: button in TreeView title and multi-step quick pick flow.

## Deliverables

1. Update `package.json` - Add createAgent command and menu
2. Update `src/adapters/inbound/controllers/ThreadListController.ts` - Add createThread method
3. Update `src/adapters/inbound/ui/ThreadTreeDataProvider.ts` - Refresh after creation
4. Wire command in `src/extension.ts`

## Technical Design

```typescript
// src/adapters/inbound/controllers/ThreadListController.ts
export class ThreadListController {
  constructor(
    // existing deps...
    private readonly createThreadUseCase: ICreateThreadUseCase,
  ) {}

  async createThread(): Promise<void> {
    // Step 1: Name input
    const name = await vscode.window.showInputBox({
      prompt: 'Enter agent name',
      placeHolder: 'fix-login-bug',
      validateInput: (value) => value.trim() ? null : 'Name is required',
    });
    if (!name) return;

    // Step 2: Isolation mode
    const isolationMode = await vscode.window.showQuickPick([
      { label: 'Current workspace', description: 'No isolation', mode: 'none' as const },
      { label: 'New branch', description: 'Create a new git branch', mode: 'branch' as const },
      { label: 'New worktree', description: 'Recommended for parallel work', mode: 'worktree' as const },
    ], {
      placeHolder: 'Select isolation mode',
    });
    if (!isolationMode) return;

    // Step 3: Branch name (if needed)
    let branchName: string | undefined;
    if (isolationMode.mode !== 'none') {
      branchName = await vscode.window.showInputBox({
        prompt: 'Branch name',
        value: name,
        placeHolder: name,
      });
      if (branchName === undefined) return;
    }

    // Execute
    try {
      const result = await this.createThreadUseCase.execute({
        name: name.trim(),
        isolationMode: isolationMode.mode,
        branchName: branchName?.trim(),
        workspaceRoot: this.getWorkspaceRoot(),
      });

      // Refresh tree and select new thread
      this.treeDataProvider.refresh();
      this.selectThread(result.threadState.threadId);

      vscode.window.showInformationMessage(`Agent "${name}" created`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create agent: ${error.message}`);
    }
  }
}
```

```json
// package.json additions
{
  "contributes": {
    "commands": [
      {
        "command": "sidecar.createAgent",
        "title": "Sidecar: Create New Agent",
        "icon": "$(add)"
      }
    ],
    "menus": {
      "view/title": [
        {
          "command": "sidecar.createAgent",
          "when": "view == sidecarThreadList",
          "group": "navigation"
        }
      ]
    }
  }
}
```

## Test Scenarios

### TS7.1: Create Thread via Button

**Given**: Sidecar sidebar is visible with thread list
**When**: User clicks "+" button in view title
**Then**: Name input box appears

### TS7.2: Complete Creation Flow

**Given**: User in name input step
**When**: User enters "fix-bug" → selects "New branch" → accepts default branch name
**Then**:
- Thread created with branch "fix-bug"
- Terminal opens
- Thread appears in list
- Thread is selected
- Success notification shown

### TS7.3: Cancel at Name Step

**Given**: Name input is shown
**When**: User presses Escape
**Then**: Flow cancelled, no thread created

### TS7.4: Cancel at Isolation Step

**Given**: Isolation mode picker is shown
**When**: User presses Escape
**Then**: Flow cancelled, no thread created

### TS7.5: Validation - Empty Name

**Given**: Name input is shown
**When**: User tries to submit empty name
**Then**: Validation error shown, cannot proceed

### TS7.6: Error Handling - Git Failure

**Given**: User completes flow with branch "main" that exists
**When**: CreateThreadUseCase throws error
**Then**: Error notification shown with message

### TS7.7: Command Palette Access

**Given**: VSCode command palette open
**When**: User types "Sidecar: Create New Agent"
**Then**: Same flow starts

## Files to Modify

| File | Action |
|------|--------|
| `package.json` | MODIFY - add command and menu |
| `src/adapters/inbound/controllers/ThreadListController.ts` | MODIFY - add createThread |
| `src/extension.ts` | MODIFY - register command |

## Dependencies

- Task 6: CreateThreadUseCase

## Notes

- Button uses `$(add)` icon from VSCode codicons
- Quick pick shows recommended option first
- Branch name defaults to thread name
- Handles all cancellation points gracefully
