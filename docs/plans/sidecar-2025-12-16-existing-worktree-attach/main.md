# Implementation Plan: Attach to Existing Git Worktree

## Summary

Allow users to attach Code Squad to an existing git worktree that was created outside of the extension (via manual `git worktree add` or other tools). This enables reusing existing worktrees instead of forcing recreation through Code Squad.

## Technical Design

### Current State Analysis

**Existing Components**:

| Component | Location | Status |
|-----------|----------|--------|
| `CreateThreadUseCase` | `application/useCases/CreateThreadUseCase.ts` | Implements worktree creation flow |
| `IGitPort` | `application/ports/outbound/IGitPort.ts` | Has `createWorktree()` |
| `VscodeGitGateway` | `adapters/outbound/gateways/VscodeGitGateway.ts` | Implements git operations |
| `ThreadListController` | `adapters/inbound/controllers/ThreadListController.ts` | Handles thread creation from webview |
| `ThreadListWebviewProvider` | `adapters/inbound/ui/ThreadListWebviewProvider.ts` | Renders thread list UI |

**Missing Components**:

1. `IGitPort` lacks worktree discovery and validation methods
2. No `AttachToWorktreeUseCase` to handle attach flow
3. No UI integration for "Attach to Worktree" button
4. No worktree selection Quick Pick flow

### Architecture Compliance

Following Hexagonal Architecture:

```
Domain Layer (Pure Logic)
    ├── ThreadState (existing) - Thread metadata entity
    └── No new entities needed

Application Layer (No VSCode imports)
    ├── ports/inbound/
    │   └── IAttachToWorktreeUseCase.ts (NEW) - Attach use case interface
    ├── ports/outbound/
    │   └── IGitPort.ts (EXTEND) - Add worktree discovery methods
    └── useCases/
        └── AttachToWorktreeUseCase.ts (NEW) - Attach logic

Adapters Layer (VSCode Integration)
    ├── outbound/gateways/
    │   └── VscodeGitGateway.ts (EXTEND) - Implement worktree methods
    └── inbound/
        ├── controllers/
        │   └── ThreadListController.ts (EXTEND) - Add attach flow
        └── ui/
            └── ThreadListWebviewProvider.ts (EXTEND) - Add UI button

Extension Entry Point
    └── extension.ts (MODIFY) - Wire up new use case
```

### Data Flow

#### Attach to Worktree Flow

```
User clicks "Attach to Worktree" button
    │
    ├── ThreadListController.attachToWorktree()
    │   │
    │   ├── GitPort.listWorktrees(workspaceRoot)
    │   │   └── Execute: git worktree list --porcelain
    │   │   └── Parse output to WorktreeInfo[]
    │   │   └── Filter out main repo root
    │   │   └── Filter out already-attached worktrees
    │   │
    │   ├── Show vscode.window.showQuickPick(worktrees)
    │   │   └── Display: /path/to/worktree (branch: branch-name)
    │   │
    │   ├── User selects worktree
    │   │
    │   ├── Show vscode.window.showInputBox()
    │   │   └── Pre-filled with branch name
    │   │   └── User can edit thread name
    │   │
    │   ├── AttachToWorktreeUseCase.execute({
    │   │     worktreePath,
    │   │     name,
    │   │     workspaceRoot
    │   │   })
    │   │   │
    │   │   ├── GitPort.isValidWorktree(path)
    │   │   │   └── Check path exists and accessible
    │   │   │   └── Execute: git rev-parse --git-dir
    │   │   │   └── Verify in git worktree list
    │   │   │
    │   │   ├── GitPort.getWorktreeBranch(path)
    │   │   │   └── Execute: git rev-parse --abbrev-ref HEAD
    │   │   │
    │   │   ├── TerminalPort.createTerminal(name, worktreePath)
    │   │   │
    │   │   ├── ThreadState.create({
    │   │   │     name,
    │   │   │     terminalId,
    │   │   │     workingDir: worktreePath,
    │   │   │     branch,
    │   │   │     worktreePath,
    │   │   │     whitelistPatterns: []
    │   │   │   })
    │   │   │
    │   │   └── ThreadStateRepository.save(threadState)
    │   │
    │   ├── attachCodeSquad(terminalId)
    │   │
    │   ├── ThreadListController.refresh()
    │   │
    │   └── ThreadListController.selectThread(terminalId)
```

### API Changes

#### IGitPort (Extend)

```typescript
// Add to existing interface
export interface WorktreeInfo {
    path: string;        // Absolute path
    branch: string;      // Branch name (e.g., "feature-x")
    head: string;        // Commit SHA
}

export interface IGitPort {
    // ... existing methods

    // NEW: List all git worktrees
    listWorktrees(workspaceRoot: string): Promise<WorktreeInfo[]>;

    // NEW: Validate if path is a valid git worktree
    isValidWorktree(path: string, workspaceRoot: string): Promise<boolean>;

    // NEW: Get branch name for a worktree
    getWorktreeBranch(worktreePath: string): Promise<string>;
}
```

#### IAttachToWorktreeUseCase (New)

```typescript
export interface AttachToWorktreeInput {
    worktreePath: string;
    name?: string;  // Optional, defaults to branch name
    workspaceRoot: string;
}

export interface AttachToWorktreeOutput {
    threadState: ThreadState;
}

export interface IAttachToWorktreeUseCase {
    execute(input: AttachToWorktreeInput): Promise<AttachToWorktreeOutput>;
}
```

#### ThreadListWebviewProvider (Extend)

Add new message type for webview communication:

```typescript
// Add to existing message handling
interface AttachToWorktreeMessage {
    type: 'attachToWorktree';
}
```

### Git Worktree List Parsing

The `git worktree list --porcelain` format:

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

Parsing strategy:
1. Split by blank lines (each entry is 3 lines)
2. Extract `worktree` path from first line
3. Extract branch name from `branch refs/heads/{name}` line
4. Extract HEAD SHA from second line
5. Skip main repository root (first entry)

### Duplicate Prevention

Filter out already-attached worktrees:

```typescript
const attachedPaths = new Set(
    Array.from(sessions.values())
        .map(ctx => ctx.threadState?.worktreePath)
        .filter(Boolean)
);

const availableWorktrees = allWorktrees.filter(
    wt => !attachedPaths.has(wt.path)
);
```

### Error Handling

| Error Case | Detection | User Message | Recovery |
|------------|-----------|--------------|----------|
| No worktrees exist | `listWorktrees()` returns empty | "No git worktrees found in this repository" | Guide to CreateThread |
| All worktrees attached | After filtering, list is empty | "All worktrees are already attached to threads" | Show existing threads |
| Path inaccessible | `fs.access()` fails | "Cannot access worktree at {path}" | Check permissions |
| Not a git worktree | `git rev-parse` fails | "Selected path is not a valid git worktree" | Select different path |
| Git command failed | exec error | "Failed to query worktrees: {error}" | Check git installation |
| Thread name conflict | ThreadState with same name exists | "Thread name already exists" | User edits name |

## Test Scenarios

### TS1: List Available Worktrees

**Given**: Workspace has 3 worktrees, 1 already attached
**When**: User clicks "Attach to Worktree"
**Then**: Quick Pick shows 2 available worktrees (excluding attached one)
**And**: Each item shows path and branch name

### TS2: Attach to Selected Worktree

**Given**: User selects worktree at `/path/to/worktree` with branch `feature-x`
**When**: User confirms thread name
**Then**: ThreadState is created with:
- `name`: User-entered name
- `worktreePath`: `/path/to/worktree`
- `branch`: `feature-x`
- `workingDir`: `/path/to/worktree`
**And**: Terminal opens in `/path/to/worktree`
**And**: Thread appears in thread list

### TS3: Default Thread Name from Branch

**Given**: Selected worktree has branch `bugfix-login`
**When**: Thread name input is shown
**Then**: Input box is pre-filled with `bugfix-login`
**And**: User can edit the name

### TS4: Validate Worktree Path

**Given**: User tries to attach to invalid path
**When**: `isValidWorktree()` is called
**Then**: Validation fails
**And**: Error message is shown: "Selected path is not a valid git worktree"

### TS5: No Worktrees Available

**Given**: No git worktrees exist (only main repo)
**When**: User clicks "Attach to Worktree"
**Then**: Message shown: "No git worktrees found in this repository"
**And**: User is guided to create worktree via CreateThread

### TS6: All Worktrees Already Attached

**Given**: 2 worktrees exist, both attached to threads
**When**: User clicks "Attach to Worktree"
**Then**: Message shown: "All worktrees are already attached to threads"

### TS7: Attached Thread Behaves Like Created Thread

**Given**: Thread attached to existing worktree
**When**: User selects the thread
**Then**: Terminal switches to worktree directory
**And**: File changes are tracked in worktree
**And**: Git operations use worktree context

### TS8: Parse Worktree List

**Given**: `git worktree list --porcelain` returns valid output
**When**: `listWorktrees()` is called
**Then**: Output is parsed to WorktreeInfo array
**And**: Main repository root is excluded
**And**: Branch names are extracted from `refs/heads/` format

## Tasks

| # | Task | Dependencies | Estimated Complexity |
|---|------|--------------|---------------------|
| 1 | Extend IGitPort with worktree operations | - | Low |
| 2 | Implement worktree methods in VscodeGitGateway | 1 | Medium |
| 3 | Create AttachToWorktreeUseCase | 1 | Low |
| 4 | Add UI integration to ThreadListController | 3 | Medium |
| 5 | Add "Attach to Worktree" button to webview | - | Low |
| 6 | Wire dependencies in extension.ts | 3 | Low |

## Dependencies

**Existing Components**:
- `IThreadStateRepository` - Save attached thread state
- `ITerminalPort` - Create terminal in worktree directory
- `ThreadState` entity - Store thread metadata
- `ThreadListController` - Handle attach flow
- `VscodeGitGateway` - Git operations

**No New Dependencies Required**

## Success Criteria

1. User can click "Attach to Worktree" button in thread list sidebar
2. Quick Pick shows available worktrees (excluding already-attached ones)
3. User can select a worktree and optionally customize thread name
4. Thread is created with correct metadata (worktreePath, branch, workingDir)
5. Terminal opens in worktree directory
6. Attached thread behaves identically to threads created with "Worktree" isolation mode
7. System prevents attaching to same worktree twice
8. Clear error messages for all failure cases (no worktrees, invalid path, etc.)
9. Performance: Worktree listing completes in <2 seconds for typical repositories

## Non-Functional Requirements

- **NFR1: Performance** - Worktree listing should complete within 2 seconds for repositories with <100 worktrees
- **NFR2: Error Handling** - Clear error messages for all failure cases
- **NFR3: Consistency** - Attached threads should behave identically to threads created with "Worktree" isolation mode
- **NFR4: Compatibility** - Must work with worktrees created by any git version or tool

## Out of Scope

1. Attaching to non-worktree directories (only git worktrees supported)
2. Worktree creation (use CreateThreadUseCase for that)
3. Worktree cleanup when removing thread
4. Automatic detection/suggestion of unattached worktrees
5. Branch switching within attached worktree
6. Cross-repository worktrees
