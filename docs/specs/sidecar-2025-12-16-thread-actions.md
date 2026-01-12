# Thread Actions

## Summary

Add action buttons to each thread in the thread list UI, allowing users to delete threads (with cleanup of associated resources), rename threads, and switch git branches for worktree-based threads. These actions provide essential thread management capabilities for the multi-agent workflow.

## Motivation

Currently, users can create threads and switch between them, but there's no way to manage existing threads:
- Cannot remove threads when work is complete or no longer needed
- Cannot rename threads to better reflect their current purpose
- Cannot clean up worktrees, branches, or terminals after thread completion
- Thread list becomes cluttered with obsolete threads over time

Thread actions provide the missing lifecycle management for threads, allowing users to maintain a clean and organized multi-agent workspace.

## Use Cases

### DeleteThread

- **Actor**: Developer managing threads
- **Trigger**: User clicks delete button on a thread in the thread list
- **Preconditions**:
  - Thread exists in thread list
  - User confirms deletion
- **Flow**:
  1. User clicks delete button (trash icon) on thread item
  2. System shows confirmation dialog with cleanup options:
     - "Delete thread state only" (keep terminal, branch, worktree)
     - "Delete and close terminal"
     - "Delete and remove worktree" (also removes branch)
  3. User confirms deletion with selected options
  4. System performs cleanup based on selection:
     - Close terminal if requested
     - Remove worktree and branch if requested (only for worktree-mode threads)
     - Delete thread state from repository
     - Clear thread from sessions map
     - Delete thread-scoped comments
     - Clear status detection state
  5. System refreshes thread list
  6. If deleted thread was selected, switch to next available thread or show empty state
- **Business Rules**:
  - Cannot delete thread if it's the only active thread (must have at least one)
  - Worktree deletion requires user confirmation with warning about uncommitted changes
  - Terminal disposal only closes the terminal, doesn't kill running processes
  - Comments with matching threadId are deleted
  - Thread state persisted in `.vscode/code-squad-threads.json` is removed
  - If deleting currently selected thread, auto-select next thread or clear selection
- **Location**: `application/useCases/DeleteThreadUseCase.ts`

### RenameThread

- **Actor**: Developer managing threads
- **Trigger**: User clicks rename button on a thread in the thread list
- **Preconditions**: Thread exists in thread list
- **Flow**:
  1. User clicks rename button (edit icon) on thread item
  2. System shows input box with current thread name pre-filled
  3. User enters new name and confirms
  4. System validates name (non-empty, no special characters that break terminal names)
  5. System updates ThreadState.name in repository
  6. System updates terminal title to match new name
  7. System refreshes thread list and Code Squad panel header
  8. System updates status detection thread name for notifications
- **Business Rules**:
  - Thread name must be non-empty
  - Thread name length: 1-50 characters
  - Thread name can contain alphanumeric, hyphens, underscores, slashes (for feature branches)
  - Renaming doesn't affect branch name or worktree path (those remain unchanged)
  - Terminal title updates to reflect new name
  - threadId remains unchanged (stable identifier)
- **Location**: `application/useCases/RenameThreadUseCase.ts`

### SwitchThreadBranch

- **Actor**: Developer working in worktree-based thread
- **Trigger**: User clicks branch switcher button on a worktree thread
- **Preconditions**:
  - Thread has worktree (isolationMode was 'worktree')
  - Worktree is valid and accessible
- **Flow**:
  1. User clicks branch switcher button on thread item
  2. System shows quick pick with available branches in the worktree's repository
  3. User selects target branch
  4. System checks for uncommitted changes in worktree
  5. If uncommitted changes exist, show warning and options:
     - "Stash changes and switch"
     - "Discard changes and switch"
     - "Cancel"
  6. User confirms action
  7. System performs git operations in worktree:
     - Stash or discard changes if needed
     - Switch to target branch
  8. System updates ThreadState.branch to new branch name
  9. System refreshes file list from new branch state
  10. System shows success notification
- **Business Rules**:
  - Only available for threads with worktreePath (worktree mode)
  - Disabled for threads without worktree (Local/none mode)
  - Branch switching happens in worktree directory, not main workspace
  - Uncommitted changes must be handled before switching
  - File snapshots are cleared when switching branches (new baseline)
  - Terminal working directory remains in worktree path
- **Location**: `application/useCases/SwitchThreadBranchUseCase.ts`

### ShowThreadActions

- **Actor**: System
- **Trigger**: User hovers over thread item in thread list
- **Preconditions**: Thread list is visible
- **Flow**:
  1. User hovers mouse over thread item
  2. System shows action buttons overlaid on thread item:
     - Rename button (pencil icon)
     - Branch switcher button (git branch icon) - only for worktree threads
     - Delete button (trash icon)
  3. User can click any action button
  4. Action buttons fade out when mouse leaves thread item
- **Business Rules**:
  - Action buttons appear on hover with 150ms delay
  - Branch switcher only visible for worktree-mode threads
  - Delete button always visible
  - Rename button always visible
  - Buttons positioned on right side of thread item
  - Click on action button doesn't trigger thread selection
- **Location**: `adapters/inbound/ui/ThreadListWebviewProvider.ts` (UI only, no use case)

## UI/UX

### Thread Item with Actions (on hover)

```
┌──────────────────────────────────────────┐
│ ● Backend Agent                    📝 🌿 🗑 │  ← Hover state with action buttons
│   └ 3 files changed                      │
└──────────────────────────────────────────┘

Icons:
- 📝 (pencil): Rename thread
- 🌿 (branch): Switch branch (only for worktree threads)
- 🗑 (trash): Delete thread
```

### Delete Confirmation Dialog

```
┌─────────────────────────────────────────────────┐
│ Delete thread "Backend Agent"?                  │
│                                                 │
│ Choose cleanup options:                        │
│ ☐ Close terminal                               │
│ ☐ Remove worktree and branch                   │
│   ⚠️  This will delete uncommitted changes!    │
│                                                 │
│ [Cancel]  [Delete Thread Only]  [Delete All]   │
└─────────────────────────────────────────────────┘
```

### Rename Input Box

```
┌─────────────────────────────────────────────────┐
│ Rename thread                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ Backend Agent                               │ │  ← Pre-filled with current name
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Cancel]  [Rename]                              │
└─────────────────────────────────────────────────┘
```

### Branch Switcher Quick Pick

```
┌─────────────────────────────────────────────────┐
│ Switch branch for "Backend Agent"               │
│                                                 │
│ > main                                          │
│   feature/user-auth                             │
│   feature/database-migration                    │
│   bugfix/login-error                            │
└─────────────────────────────────────────────────┘
```

### Thread Item Layout (with action buttons)

```html
<!-- Updated thread item HTML in ThreadListWebviewProvider -->
<div class="thread-item" data-id="terminal-id">
  <span class="thread-status working">●</span>
  <span class="thread-name">Backend Agent</span>

  <!-- Action buttons (visible on hover) -->
  <div class="thread-actions">
    <button class="thread-action-btn rename-btn" title="Rename thread">
      <span class="codicon codicon-edit"></span>
    </button>
    <button class="thread-action-btn branch-btn" title="Switch branch" data-has-worktree="true">
      <span class="codicon codicon-git-branch"></span>
    </button>
    <button class="thread-action-btn delete-btn" title="Delete thread">
      <span class="codicon codicon-trash"></span>
    </button>
  </div>

  <button class="thread-terminal-btn" title="Open terminal">⟩_</button>
</div>
```

## Data Flow

### Delete Thread Flow

```
User clicks delete button
    │
    ├── ThreadListWebviewProvider sends 'deleteThread' message
    │       { type: 'deleteThread', id: terminalId, options: {...} }
    ├── ThreadListController.deleteThread(id, options)
    │       │
    │       └── DeleteThreadUseCase.execute({ threadId, options })
    │               │
    │               ├── ThreadStateRepository.findByTerminalId(id) → ThreadState
    │               ├── (if options.closeTerminal) TerminalPort.closeTerminal(id)
    │               ├── (if options.removeWorktree) GitPort.removeWorktree(worktreePath)
    │               ├── CommentRepository.deleteByThreadId(threadState.threadId)
    │               ├── ThreadStateRepository.delete(threadState.threadId)
    │               ├── sessions.delete(terminalId)
    │               ├── DetectThreadStatusUseCase.clear(terminalId)
    │               └── return { success: true }
    │
    └── ThreadListController.refresh()
            └── (if deleted was selected) selectThread(nextThreadId)
```

### Rename Thread Flow

```
User clicks rename button
    │
    ├── ThreadListWebviewProvider sends 'renameThread' message
    │       { type: 'renameThread', id: terminalId, newName: string }
    ├── ThreadListController.renameThread(id, newName)
    │       │
    │       └── RenameThreadUseCase.execute({ threadId, newName })
    │               │
    │               ├── ThreadStateRepository.findByTerminalId(id) → ThreadState
    │               ├── ThreadState.rename(newName) [new method]
    │               ├── ThreadStateRepository.save(threadState)
    │               ├── TerminalPort.updateTerminalName(id, newName)
    │               ├── DetectThreadStatusUseCase.setThreadName(id, newName)
    │               └── return { success: true, threadState }
    │
    └── ThreadListController.refresh()
```

### Switch Thread Branch Flow

```
User clicks branch button
    │
    ├── ThreadListWebviewProvider sends 'switchThreadBranch' message
    │       { type: 'switchThreadBranch', id: terminalId }
    ├── ThreadListController.switchThreadBranch(id)
    │       │
    │       ├── Show Quick Pick with branches
    │       ├── User selects branch
    │       └── SwitchThreadBranchUseCase.execute({ threadId, targetBranch })
    │               │
    │               ├── ThreadStateRepository.findByTerminalId(id) → ThreadState
    │               ├── (if !worktreePath) throw Error("Not a worktree thread")
    │               ├── GitPort.getUncommittedFiles(worktreePath) → check changes
    │               ├── (if has changes) show warning dialog
    │               ├── GitPort.switchBranch(worktreePath, targetBranch, stashChanges)
    │               ├── ThreadState.updateBranch(targetBranch) [new method]
    │               ├── ThreadStateRepository.save(threadState)
    │               ├── Clear snapshots for this thread
    │               └── return { success: true, threadState }
    │
    └── ThreadListController.selectThread(id) → refresh file list
```

## API Changes

### ThreadState Entity (new methods)

```typescript
class ThreadState {
  // Existing fields...

  rename(newName: string): void {
    // Validation
    if (!newName || newName.length > 50) {
      throw new Error('Invalid thread name');
    }
    // Update via repository (immutable pattern preserved)
  }

  updateBranch(newBranch: string): void {
    // Update branch name (for branch switching)
  }
}
```

### IThreadStateRepository (already has delete)

```typescript
export interface IThreadStateRepository {
  // Existing methods...
  delete(threadId: string): Promise<boolean>;  // Already exists
}
```

### ITerminalPort (new methods)

```typescript
export interface ITerminalPort {
  // Existing methods...

  /**
   * Close a terminal by ID.
   * Disposes the terminal instance but doesn't kill running processes.
   */
  closeTerminal(terminalId: string): void;

  /**
   * Update terminal name/title.
   * Updates the terminal display name in VSCode UI.
   */
  updateTerminalName(terminalId: string, newName: string): void;
}
```

### IGitPort (new methods)

```typescript
export interface IGitPort {
  // Existing methods...

  /**
   * Remove a git worktree and its associated branch.
   * Executes `git worktree remove <path>` and `git branch -D <branch>`.
   *
   * @param worktreePath - Absolute path to worktree to remove
   * @param workspaceRoot - Root directory of main repository
   * @param force - Force removal even with uncommitted changes
   */
  removeWorktree(worktreePath: string, workspaceRoot: string, force?: boolean): Promise<void>;

  /**
   * Switch to a different branch in a worktree.
   * Executes `git checkout <branch>` in the worktree directory.
   *
   * @param worktreePath - Absolute path to worktree
   * @param targetBranch - Branch name to switch to
   * @param stashChanges - Whether to stash uncommitted changes before switching
   */
  switchBranch(worktreePath: string, targetBranch: string, stashChanges?: boolean): Promise<void>;

  /**
   * List all branches in a repository.
   * Executes `git branch --list` and returns branch names.
   *
   * @param workspaceRoot - Repository root directory
   * @returns Array of branch names
   */
  listBranches(workspaceRoot: string): Promise<string[]>;
}
```

### ICommentRepository (new method)

```typescript
export interface ICommentRepository {
  // Existing methods...

  /**
   * Delete all comments associated with a thread.
   * Used during thread cleanup.
   *
   * @param threadId - Thread ID to delete comments for
   * @returns Number of comments deleted
   */
  deleteByThreadId(threadId: string): Promise<number>;
}
```

### ThreadListWebviewProvider messages (new)

```typescript
// Outbound (webview → extension)
interface DeleteThreadMessage {
  type: 'deleteThread';
  id: string;  // terminalId
}

interface RenameThreadMessage {
  type: 'renameThread';
  id: string;  // terminalId
  newName: string;
}

interface SwitchThreadBranchMessage {
  type: 'switchThreadBranch';
  id: string;  // terminalId
}
```

### DeleteThreadInput/Output

```typescript
export interface DeleteThreadInput {
  terminalId: string;
  closeTerminal?: boolean;
  removeWorktree?: boolean;
}

export interface DeleteThreadOutput {
  success: boolean;
  deletedThreadId: string;
}

export interface IDeleteThreadUseCase {
  execute(input: DeleteThreadInput): Promise<DeleteThreadOutput>;
}
```

### RenameThreadInput/Output

```typescript
export interface RenameThreadInput {
  terminalId: string;
  newName: string;
}

export interface RenameThreadOutput {
  success: boolean;
  threadState: ThreadState;
}

export interface IRenameThreadUseCase {
  execute(input: RenameThreadInput): Promise<RenameThreadOutput>;
}
```

### SwitchThreadBranchInput/Output

```typescript
export interface SwitchThreadBranchInput {
  terminalId: string;
  targetBranch: string;
  stashChanges?: boolean;
}

export interface SwitchThreadBranchOutput {
  success: boolean;
  threadState: ThreadState;
  previousBranch: string;
}

export interface ISwitchThreadBranchUseCase {
  execute(input: SwitchThreadBranchInput): Promise<SwitchThreadBranchOutput>;
}
```

## Out of Scope

- Bulk thread operations (delete multiple threads at once)
- Thread archiving (soft delete with restore capability)
- Thread duplication (clone thread with same settings)
- Thread templates (save/load thread configurations)
- Thread grouping/categorization in UI
- Branch creation from thread UI (use git commands in terminal)
- Worktree path relocation
- Thread export/import for sharing between workspaces

## Open Questions

1. **Thread Deletion Behavior**:
   - Should deleting the last thread close Code Squad panel automatically?
   - What happens if user deletes a thread with an active AI session?
   - Should we prevent deletion of threads with unsaved comments?

2. **Terminal Lifecycle**:
   - When closing terminal, should we warn if AI process is still running?
   - Should terminal closure kill the AI process or just dispose the UI?
   - How to handle terminal disposal if terminal was externally closed?

3. **Worktree Cleanup**:
   - Should worktree removal be async with progress indicator?
   - What if worktree path is not accessible (network drive, permission issue)?
   - Should we offer "prune" option to clean up stale worktree references?

4. **Branch Switching**:
   - Should branch switching trigger file snapshot refresh automatically?
   - What if target branch doesn't exist locally (need to fetch)?
   - Should we support creating new branch during switch operation?

5. **Rename Validation**:
   - Should thread names be unique within workspace?
   - Are there any reserved names to avoid (e.g., "main", "master")?
   - Should rename update anything besides ThreadState.name?

## Dependencies

### New Use Cases
- `DeleteThreadUseCase` - Orchestrates thread cleanup
- `RenameThreadUseCase` - Updates thread name across system
- `SwitchThreadBranchUseCase` - Switches git branch in worktree

### Modified Components
- `ThreadListWebviewProvider` - Add action buttons to thread items
- `ThreadListController` - Wire up action handlers
- `VscodeTerminalGateway` - Implement closeTerminal, updateTerminalName
- `VscodeGitGateway` - Implement removeWorktree, switchBranch, listBranches
- `JsonCommentRepository` - Implement deleteByThreadId
- `ThreadState` - Add rename and updateBranch methods (via repository)

### Configuration
No new configuration required. Uses existing settings:
- `codeSquad.autoDetect`
- `codeSquad.includeFiles`

## Success Criteria

1. User can delete a thread, with options to clean up terminal and worktree
2. User can rename a thread, and name updates across all UI elements
3. User can switch branches in worktree-based threads
4. Thread actions appear on hover with appropriate visibility (branch switcher only for worktree threads)
5. Deleting currently selected thread auto-selects next thread or shows empty state
6. Thread deletion removes associated comments and thread state
7. Action buttons don't interfere with thread selection click behavior
8. Confirmation dialogs prevent accidental deletion of threads with uncommitted work

## Notes

- Thread deletion is permanent - no undo mechanism (user must confirm)
- Renaming doesn't affect git branch name or worktree path (only display name)
- Branch switching only works for worktree threads (disabled for local threads)
- Terminal closure doesn't kill running processes (just hides the terminal UI)
- Worktree removal uses `git worktree remove` which has built-in safety checks
- ThreadState uses immutable pattern - "rename" creates new state via repository save
- Action buttons use VSCode Codicon font for consistency with VSCode UI
