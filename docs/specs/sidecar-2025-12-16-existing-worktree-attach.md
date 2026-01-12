# Spec: Attach to Existing Git Worktree

## Summary

Allow users to attach Code Squad to an existing git worktree that was created outside of the extension (via manual `git worktree add` or other tools). This enables users to reuse existing worktrees instead of being forced to recreate them through Code Squad.

## Background

Code Squad currently supports creating new worktrees through the CreateThread flow with isolation mode set to "worktree". However, users who have already created worktrees manually (via `git worktree add`) or through other tools cannot attach Code Squad to these existing worktrees. They must either:
1. Remove the existing worktree and recreate it through Code Squad (losing work in progress)
2. Use "Local" isolation mode without proper git isolation

This creates friction for users who:
- Have existing worktrees from previous work sessions
- Use external tools or scripts to manage worktrees
- Want to adopt Code Squad in a codebase with pre-existing worktree workflows

## Terms

| Term | Definition |
|------|------------|
| Worktree | Git worktree - a linked working tree that allows multiple branches to be checked out simultaneously |
| Attach | Associate a Code Squad thread with an existing terminal/worktree without creating new resources |
| External Worktree | A git worktree created outside of Code Squad (via `git worktree add` or other tools) |

## Use Cases

### UC1: AttachToExistingWorktree

| Field | Value |
|-------|-------|
| Actor | User |
| Trigger | User clicks "Attach to Worktree" button in thread list sidebar |
| Precondition | - VSCode workspace is open<br>- At least one existing git worktree exists<br>- Worktree is not already attached to a thread |
| Flow | 1. User clicks "Attach to Worktree" button in sidebar<br>2. System scans for existing git worktrees using `git worktree list`<br>3. System filters out worktrees already attached to threads<br>4. User selects a worktree from the list (shows path and branch)<br>5. User enters thread name (optional, defaults to branch name)<br>6. System validates worktree is accessible and is a valid git worktree<br>7. System creates terminal in the worktree directory<br>8. System creates ThreadState with worktree metadata<br>9. Thread appears in thread list with worktree context |
| Output | New thread attached to existing worktree, terminal opened in worktree directory |
| Business Rules | - Only show worktrees not already attached to active threads<br>- Worktree must be a valid git worktree (verified via git commands)<br>- Worktree directory must be accessible<br>- Thread name must be unique among active threads<br>- Default thread name is the branch name of the worktree |
| Error Cases | - No unattached worktrees available: Show message "No available worktrees found"<br>- Worktree path is invalid: Show error "Worktree at {path} is not accessible"<br>- Git validation fails: Show error "Invalid git worktree"<br>- Thread name conflict: Show error "Thread name already exists" |
| Location | `application/useCases/AttachToWorktreeUseCase.ts` |

### UC2: ListAvailableWorktrees

| Field | Value |
|-------|-------|
| Actor | System |
| Trigger | User initiates attach flow |
| Precondition | Workspace is a git repository |
| Flow | 1. Execute `git worktree list --porcelain`<br>2. Parse output to extract worktree paths and branches<br>3. Check each worktree for accessibility<br>4. Filter out main repository root (not a linked worktree)<br>5. Filter out worktrees already attached to active threads<br>6. Return list of available worktrees |
| Output | List of { path: string, branch: string } for available worktrees |
| Business Rules | - Main repository root is excluded (only linked worktrees)<br>- Inaccessible worktrees are filtered out<br>- Already-attached worktrees are excluded |
| Location | `application/ports/outbound/IGitPort.ts` (new method: `listWorktrees()`) |

### UC3: ValidateWorktreePath

| Field | Value |
|-------|-------|
| Actor | System |
| Trigger | Before attaching to worktree |
| Precondition | Worktree path is provided |
| Flow | 1. Check if path exists and is accessible<br>2. Execute `git rev-parse --show-toplevel` in the directory<br>3. Verify it is a git repository<br>4. Execute `git worktree list` from main repo and verify path is listed<br>5. Return validation result |
| Output | Boolean indicating if path is a valid git worktree |
| Business Rules | - Must be an existing directory<br>- Must be a valid git repository<br>- Must be listed as a worktree of the main repository |
| Location | `application/ports/outbound/IGitPort.ts` (new method: `isValidWorktree()`) |

## User Stories

1. **As a developer**, I want to attach Code Squad to my existing worktree created via `git worktree add`, so that I don't have to recreate it and lose my work in progress.

2. **As a team member**, I want to reuse worktrees created by build scripts or CI tools, so that I can review AI changes in the same environment as my automated processes.

3. **As a returning user**, I want to attach to worktrees from previous sessions, so that I can continue work without manual git operations.

4. **As a power user**, I want to see which worktrees are already attached to threads, so that I avoid creating duplicate thread contexts.

## Requirements

### Functional Requirements

1. **FR1: Worktree Discovery** - System must scan and list all existing git worktrees
2. **FR2: Worktree Validation** - System must validate that a path is a legitimate git worktree before attaching
3. **FR3: Duplicate Prevention** - System must prevent attaching to a worktree that is already connected to an active thread
4. **FR4: Thread Creation** - System must create a thread with proper metadata (worktreePath, branch, workingDir)
5. **FR5: Terminal Integration** - System must create a terminal in the worktree directory
6. **FR6: UI Integration** - Attach flow must be accessible from thread list sidebar
7. **FR7: Default Naming** - Thread name should default to the branch name of the worktree
8. **FR8: Manual Override** - Users can override the default thread name

### Non-Functional Requirements

1. **NFR1: Performance** - Worktree listing should complete within 2 seconds for repositories with <100 worktrees
2. **NFR2: Error Handling** - Clear error messages for all failure cases (invalid path, permission denied, etc.)
3. **NFR3: Consistency** - Attached threads should behave identically to threads created with "Worktree" isolation mode
4. **NFR4: Compatibility** - Must work with worktrees created by any git version or tool

## Out of Scope

1. **Attaching to non-worktree directories** - Only git worktrees are supported, not arbitrary directories
2. **Worktree creation** - This feature only attaches to existing worktrees, it does not create new ones
3. **Worktree cleanup** - Removing attached threads does not delete the underlying worktree
4. **Automatic detection** - System does not automatically suggest attaching to unattached worktrees
5. **Branch switching** - Once attached, the thread is bound to the current branch of the worktree
6. **Cross-repository worktrees** - Only worktrees belonging to the current workspace repository

## UI Changes

### Thread List Sidebar - New "Attach to Worktree" Button

Add a new button below "Start Thread" button:

```
┌─────────────────────────────┐
│ ▾ New Thread                │
│   [Thread Name Input]       │
│   [Start Thread]            │
│   [Attach to Worktree]      │ ← NEW
├─────────────────────────────┤
│ ▾ Agent Threads             │
│   ● feat/login (3)          │
└─────────────────────────────┘
```

### Attach Flow (Multi-step Quick Pick)

**Step 1: Select Worktree**
```
Select an existing worktree:
> /path/to/repo.worktree/feature-x (branch: feature-x)
  /path/to/repo.worktree/bugfix-y (branch: bugfix-y)
  /path/to/repo.worktree/refactor-z (branch: refactor-z)
```

**Step 2: Enter Thread Name**
```
Thread name (default: feature-x):
[ feature-x ]                    ← Pre-filled with branch name, editable
```

**Step 3: Complete**
- Terminal opens in worktree directory
- Thread appears in thread list
- Thread is automatically selected

## API Changes

### IGitPort (extend)

```typescript
interface IGitPort {
  // Existing methods...

  // New methods
  listWorktrees(workspaceRoot: string): Promise<WorktreeInfo[]>;
  isValidWorktree(path: string, workspaceRoot: string): Promise<boolean>;
  getWorktreeBranch(worktreePath: string): Promise<string>;
}

interface WorktreeInfo {
  path: string;
  branch: string;
  head: string;  // commit SHA
}
```

### IAttachToWorktreeUseCase (new)

```typescript
interface AttachToWorktreeInput {
  worktreePath: string;
  name?: string;  // Optional, defaults to branch name
  workspaceRoot: string;
}

interface AttachToWorktreeOutput {
  threadState: ThreadState;
}

interface IAttachToWorktreeUseCase {
  execute(input: AttachToWorktreeInput): Promise<AttachToWorktreeOutput>;
}
```

### ThreadListWebviewProvider (extend)

```typescript
interface CreateThreadOptions {
  name: string;
  isolationMode: IsolationMode;
  branchName?: string;
  worktreePath?: string;
}

// Add new message type
interface AttachToWorktreeMessage {
  type: 'attachToWorktree';
}
```

## Data Flow

### Attach Flow

```
User clicks "Attach to Worktree"
    │
    ├── ThreadListController receives message
    │
    ├── GitPort.listWorktrees(workspaceRoot)
    │       └── Execute: git worktree list --porcelain
    │       └── Parse and filter results
    │
    ├── Show Quick Pick with available worktrees
    │
    ├── User selects worktree
    │
    ├── Show Input Box for thread name (pre-filled with branch)
    │
    ├── AttachToWorktreeUseCase.execute({
    │     worktreePath,
    │     name,
    │     workspaceRoot
    │   })
    │       │
    │       ├── GitPort.isValidWorktree(path)
    │       │
    │       ├── GitPort.getWorktreeBranch(path)
    │       │
    │       ├── TerminalPort.createTerminal(name, worktreePath)
    │       │
    │       ├── ThreadState.create({
    │       │     name,
    │       │     terminalId,
    │       │     workingDir: worktreePath,
    │       │     branch,
    │       │     worktreePath,
    │       │     whitelistPatterns: []
    │       │   })
    │       │
    │       └── ThreadStateRepository.save(threadState)
    │
    └── ThreadListController.selectThread(threadId)
```

## Implementation Notes

### Git Worktree List Format

The `git worktree list --porcelain` command outputs:

```
worktree /path/to/main-repo
HEAD abc123def456...
branch refs/heads/main

worktree /path/to/repo.worktree/feature-x
HEAD def789abc123...
branch refs/heads/feature-x

worktree /path/to/repo.worktree/bugfix-y
HEAD 456789def123...
branch refs/heads/bugfix-y
```

Parse this format to extract:
- `worktree` line: absolute path
- `branch` line: extract branch name from `refs/heads/{name}`

### Validation Strategy

1. **Path Accessibility**: Use Node.js `fs.access()` to verify directory exists and is readable
2. **Git Repository**: Execute `git rev-parse --git-dir` in the directory
3. **Worktree Membership**: Verify path appears in `git worktree list` output from main repo

### Duplicate Prevention

Maintain a set of attached worktree paths:
```typescript
const attachedPaths = new Set(
  Array.from(sessions.values())
    .map(ctx => ctx.threadState?.worktreePath)
    .filter(Boolean)
);
```

Filter out paths that exist in this set when showing available worktrees.

### Error Handling

| Error Case | User Message | Recovery Action |
|------------|--------------|-----------------|
| No worktrees exist | "No git worktrees found in this repository" | Guide user to create worktree via CreateThread |
| All worktrees attached | "All worktrees are already attached to threads" | Show existing threads |
| Path inaccessible | "Cannot access worktree at {path}" | Ask user to check permissions |
| Not a git worktree | "Selected path is not a valid git worktree" | Let user select different path |
| Git command failed | "Failed to query worktrees: {error}" | Check git installation |

## Relationship to Existing Features

### CreateThreadUseCase

AttachToWorktreeUseCase is similar to CreateThreadUseCase with `isolationMode: 'worktree'`, but:
- **Does NOT** create a new worktree via `git worktree add`
- **Does** validate the worktree already exists
- **Does** extract branch name from existing worktree instead of accepting it as input

### Shared Logic

Both use cases should:
- Create terminal via `ITerminalPort.createTerminal()`
- Create `ThreadState` with worktree metadata
- Save via `IThreadStateRepository.save()`
- Auto-select the new thread

## Success Criteria

1. User can view a list of existing git worktrees not already attached to threads
2. User can select a worktree and create a thread attached to it
3. Default thread name is pre-filled with the worktree's branch name
4. Terminal opens in the worktree directory
5. Thread behaves identically to threads created with "Worktree" isolation mode
6. System prevents attaching to the same worktree twice
7. Clear error messages for all failure cases
8. Performance: Worktree listing completes in <2 seconds for typical repositories

## Open Questions

1. **Q: Should we support attaching to the main repository root (non-worktree)?**
   - A: No, only linked worktrees. Main repo can use "Local" isolation mode.

2. **Q: What happens if a worktree's branch is deleted after attaching?**
   - A: Out of scope for this feature. Thread continues to work, branch field may be stale.

3. **Q: Should we auto-detect and suggest unattached worktrees on startup?**
   - A: No, this is out of scope. Users must manually trigger the attach flow.

4. **Q: Should we validate the worktree is from the current workspace repository?**
   - A: Yes, validate via checking that worktree appears in `git worktree list` from workspace root.

5. **Q: How do we handle worktrees with detached HEAD state?**
   - A: Use HEAD commit SHA as the branch identifier, display as "detached at {short-sha}".
