# Task 4: Add UI Integration to ThreadListController

## Goal

Add the attach-to-worktree flow to ThreadListController with Quick Pick for worktree selection and input box for thread naming.

## Location

`src/adapters/inbound/controllers/ThreadListController.ts`

## Changes

### 1. Add attachToWorktreeUseCase to Constructor

Modify constructor to accept the new use case:

```typescript
constructor(
    private readonly getSessions: () => Map<string, SessionContext>,
    private readonly terminalGateway: ITerminalPort,
    private readonly createThreadUseCase?: ICreateThreadUseCase,
    private readonly attachToWorktreeUseCase?: IAttachToWorktreeUseCase,  // NEW
    private readonly attachCodeSquad?: (terminalId: string) => Promise<void>,
    private readonly fileWatchController?: FileWatchController,
    private readonly commentRepository?: ICommentRepository,
    private readonly gitPort?: IGitPort
) {}
```

### 2. Add Import for IAttachToWorktreeUseCase

Add to imports at top of file:

```typescript
import { IAttachToWorktreeUseCase } from '../../../application/ports/inbound/IAttachToWorktreeUseCase';
```

### 3. Add Import for WorktreeInfo

```typescript
import { WorktreeInfo } from '../../../application/ports/outbound/IGitPort';
```

### 4. Add attachToWorktree() Method

Add this new public method to ThreadListController:

```typescript
/**
 * Attach Code Squad to an existing git worktree.
 * Shows Quick Pick for worktree selection and Input Box for thread naming.
 */
async attachToWorktree(): Promise<void> {
    if (!this.attachToWorktreeUseCase) {
        vscode.window.showErrorMessage('Attach to worktree use case not available');
        return;
    }

    if (!this.gitPort) {
        vscode.window.showErrorMessage('Git port not available');
        return;
    }

    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    // Step 1: Get all worktrees
    let allWorktrees: WorktreeInfo[];
    try {
        allWorktrees = await this.gitPort.listWorktrees(workspaceRoot);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to list worktrees: ${message}`);
        return;
    }

    if (allWorktrees.length === 0) {
        vscode.window.showInformationMessage(
            'No git worktrees found in this repository. Create one using "Start Thread" with Worktree isolation mode.'
        );
        return;
    }

    // Step 2: Filter out already-attached worktrees
    const sessions = this.getSessions();
    const attachedPaths = new Set(
        Array.from(sessions.values())
            .map(ctx => ctx.threadState?.worktreePath)
            .filter(Boolean)
    );

    const availableWorktrees = allWorktrees.filter(
        wt => !attachedPaths.has(wt.path)
    );

    if (availableWorktrees.length === 0) {
        vscode.window.showInformationMessage(
            'All worktrees are already attached to threads'
        );
        return;
    }

    // Step 3: Show Quick Pick for worktree selection
    const selectedWorktree = await vscode.window.showQuickPick(
        availableWorktrees.map(wt => ({
            label: wt.path,
            description: `branch: ${wt.branch}`,
            worktree: wt,
        })),
        {
            placeHolder: 'Select a worktree to attach',
        }
    );

    if (!selectedWorktree) {
        return;
    }

    // Step 4: Show Input Box for thread name (pre-filled with branch name)
    const threadName = await vscode.window.showInputBox({
        prompt: 'Thread name',
        value: selectedWorktree.worktree.branch,
        placeHolder: selectedWorktree.worktree.branch,
        validateInput: (value) => value.trim() ? null : 'Name is required',
    });

    if (!threadName) {
        return;
    }

    // Step 5: Execute attach use case
    try {
        const result = await this.attachToWorktreeUseCase.execute({
            worktreePath: selectedWorktree.worktree.path,
            name: threadName.trim(),
            workspaceRoot,
        });

        // Step 6: Auto-attach Code Squad to the new terminal
        if (this.attachCodeSquad) {
            await this.attachCodeSquad(result.threadState.terminalId);
        }

        // Step 7: Refresh and select new thread
        this.refresh();
        await this.selectThread(result.threadState.terminalId);

        vscode.window.showInformationMessage(`Agent "${threadName.trim()}" attached to worktree`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to attach to worktree: ${message}`);
    }
}
```

### 5. Add Message Handler in activate()

Modify the webview provider initialization to handle the new message type:

In `activate()` method, update the webview provider construction:

```typescript
this.webviewProvider = new ThreadListWebviewProvider(
    context.extensionUri,
    this.getSessions,
    (id) => this.selectThread(id),
    (options) => this.createThreadFromInput(options),
    (id) => this.openNewTerminal(id),
    () => this.attachToWorktree()  // NEW: Add attach handler
);
```

## Test Scenarios

### TS1: Attach Flow - Happy Path

**Given**: Repository has 2 unattached worktrees
**When**: User triggers attach flow
**Then**: Quick Pick shows 2 worktrees with path and branch
**And**: User selects worktree with branch `feature-x`
**And**: Input box shows with value `"feature-x"`
**And**: User confirms
**And**: `attachToWorktreeUseCase.execute()` is called
**And**: Code Squad is attached to new terminal
**And**: Thread list is refreshed
**And**: New thread is selected
**And**: Success message is shown: "Agent "feature-x" attached to worktree"

### TS2: No Worktrees Available

**Given**: Repository has no worktrees (only main repo)
**When**: User triggers attach flow
**Then**: `gitPort.listWorktrees()` returns empty array
**And**: Message is shown: "No git worktrees found in this repository. Create one using "Start Thread" with Worktree isolation mode."
**And**: No Quick Pick is shown

### TS3: All Worktrees Already Attached

**Given**: Repository has 2 worktrees, both attached to threads
**When**: User triggers attach flow
**Then**: After filtering, available worktrees is empty
**And**: Message is shown: "All worktrees are already attached to threads"
**And**: No Quick Pick is shown

### TS4: User Cancels Worktree Selection

**Given**: Quick Pick is shown with available worktrees
**When**: User presses Escape
**Then**: Quick Pick returns undefined
**And**: Flow stops, no thread is created
**And**: No error message

### TS5: User Cancels Thread Name Input

**Given**: User selects a worktree
**And**: Input box is shown
**When**: User presses Escape
**Then**: Input box returns undefined
**And**: Flow stops, no thread is created
**And**: No error message

### TS6: User Customizes Thread Name

**Given**: Selected worktree has branch `feature-login`
**And**: Input box is pre-filled with `"feature-login"`
**When**: User edits to `"login-fix"`
**And**: User confirms
**Then**: Thread is created with name `"login-fix"`
**And**: Branch remains `"feature-login"`

### TS7: Attach Use Case Fails

**Given**: User selects worktree and enters name
**When**: `attachToWorktreeUseCase.execute()` throws error
**Then**: Error message is shown: "Failed to attach to worktree: <error message>"
**And**: No thread is created
**And**: Thread list is not refreshed

### TS8: Git List Command Fails

**Given**: `gitPort.listWorktrees()` throws error
**When**: User triggers attach flow
**Then**: Error message is shown: "Failed to list worktrees: <error message>"
**And**: No Quick Pick is shown

### TS9: Worktree Path Display

**Given**: Worktree at `/path/to/repo.worktree/feature-x` with branch `feature-x`
**When**: Quick Pick is shown
**Then**: Item label is `/path/to/repo.worktree/feature-x`
**And**: Item description is `branch: feature-x`

### TS10: Use Case Not Available

**Given**: `attachToWorktreeUseCase` is undefined
**When**: User triggers attach flow
**Then**: Error message is shown: "Attach to worktree use case not available"
**And**: Flow stops

### TS11: Git Port Not Available

**Given**: `gitPort` is undefined
**When**: User triggers attach flow
**Then**: Error message is shown: "Git port not available"
**And**: Flow stops

### TS12: No Workspace Open

**Given**: No workspace folder is open
**When**: User triggers attach flow
**Then**: Error message is shown: "No workspace folder open"
**And**: Flow stops

## Acceptance Criteria

- [ ] `attachToWorktreeUseCase` is added to constructor parameters
- [ ] `attachToWorktree()` method is implemented
- [ ] Method gets workspace root
- [ ] Method lists all worktrees via `gitPort.listWorktrees()`
- [ ] Method filters out already-attached worktrees
- [ ] Method shows Quick Pick with available worktrees
- [ ] Quick Pick items show path (label) and branch (description)
- [ ] Method shows Input Box with branch name as default value
- [ ] Input Box validates non-empty name
- [ ] Method calls `attachToWorktreeUseCase.execute()` with correct input
- [ ] Method auto-attaches Code Squad to new terminal
- [ ] Method refreshes thread list
- [ ] Method selects newly attached thread
- [ ] Success/error messages are shown appropriately
- [ ] All error cases are handled (no use case, no git port, no workspace, git errors, use case errors)
- [ ] User can cancel at any step without errors
- [ ] Imports for IAttachToWorktreeUseCase and WorktreeInfo are added

## Implementation Notes

### Duplicate Prevention Strategy

Build a Set of attached worktree paths from existing sessions:
```typescript
const attachedPaths = new Set(
    Array.from(sessions.values())
        .map(ctx => ctx.threadState?.worktreePath)
        .filter(Boolean)
);
```

Then filter:
```typescript
availableWorktrees.filter(wt => !attachedPaths.has(wt.path))
```

### Quick Pick Format

Each item needs:
- `label`: The worktree path (primary display)
- `description`: The branch name (secondary display)
- `worktree`: The original WorktreeInfo object (for access after selection)

### Error Message Consistency

Follow existing patterns in `createThread()` method for error messages.

## Files to Modify

- `src/adapters/inbound/controllers/ThreadListController.ts`
- `src/adapters/inbound/ui/ThreadListWebviewProvider.ts` (in next task)

## Estimated Time

1 hour
