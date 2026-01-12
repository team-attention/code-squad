# Task 6: Wire Dependencies in extension.ts

## Goal

Wire up the AttachToWorktreeUseCase in the dependency injection container and connect it to ThreadListController.

## Location

`src/extension.ts`

## Changes

### 1. Import AttachToWorktreeUseCase

Add to imports section:

```typescript
import { AttachToWorktreeUseCase } from './application/useCases/AttachToWorktreeUseCase';
import { IAttachToWorktreeUseCase } from './application/ports/inbound/IAttachToWorktreeUseCase';
```

### 2. Instantiate AttachToWorktreeUseCase

Find where `CreateThreadUseCase` is instantiated (around where other use cases are created), and add:

```typescript
// Attach to Worktree Use Case
const attachToWorktreeUseCase: IAttachToWorktreeUseCase = new AttachToWorktreeUseCase(
    threadStateRepository,
    terminalGateway,
    gitGateway
);
```

### 3. Pass to ThreadListController

Find where `ThreadListController` is instantiated, and add `attachToWorktreeUseCase` as a parameter:

```typescript
const threadListController = new ThreadListController(
    getSessions,
    terminalGateway,
    createThreadUseCase,
    attachToWorktreeUseCase,  // NEW: Add this parameter
    attachCodeSquad,
    fileWatchController,
    commentRepository,
    gitGateway
);
```

### 4. Register Command (Optional)

If a command palette entry is desired, register a command:

```typescript
context.subscriptions.push(
    vscode.commands.registerCommand('codeSquad.attachToWorktree', async () => {
        await threadListController.attachToWorktree();
    })
);
```

### 5. Add to package.json (Optional - if command is registered)

If the command is registered, add to `package.json` commands section:

```json
{
    "command": "codeSquad.attachToWorktree",
    "title": "Attach to Existing Worktree",
    "category": "Code Squad"
}
```

## Test Scenarios

### TS1: Use Case Instantiated Correctly

**Given**: Extension activates
**When**: DI container is built
**Then**: `AttachToWorktreeUseCase` is instantiated with:
- `threadStateRepository`
- `terminalGateway`
- `gitGateway`
**And**: No errors are thrown

### TS2: ThreadListController Receives Use Case

**Given**: Extension activates
**When**: ThreadListController is instantiated
**Then**: `attachToWorktreeUseCase` is passed as constructor parameter
**And**: Controller can invoke `attachToWorktreeUseCase.execute()`

### TS3: Extension Activates Without Errors

**Given**: Extension is installed
**When**: VSCode starts and extension activates
**Then**: No errors in console
**And**: ThreadListController is functional
**And**: Attach to worktree flow is available

### TS4: Command Registered (Optional)

**Given**: Command is registered in extension.ts
**When**: User opens Command Palette
**Then**: "Code Squad: Attach to Existing Worktree" is listed
**And**: Clicking it invokes `threadListController.attachToWorktree()`

### TS5: Dependency Graph Validated

**Given**: All components are wired
**When**: User triggers attach flow
**Then**: AttachToWorktreeUseCase can access:
- `threadStateRepository.save()`
- `terminalGateway.createTerminal()`
- `gitGateway.isValidWorktree()`
- `gitGateway.getWorktreeBranch()`
**And**: All dependencies are available

## Acceptance Criteria

- [ ] `AttachToWorktreeUseCase` is imported
- [ ] `IAttachToWorktreeUseCase` interface is imported
- [ ] `AttachToWorktreeUseCase` is instantiated with correct dependencies
- [ ] Use case instance is passed to `ThreadListController` constructor
- [ ] Extension activates without errors
- [ ] TypeScript compilation succeeds
- [ ] All dependencies are correctly resolved
- [ ] Optional: Command is registered and functional

## Implementation Notes

### Dependency Injection Pattern

Follow the existing pattern in `extension.ts`:

1. Instantiate gateways/repositories first (concrete implementations)
2. Instantiate use cases second (application layer)
3. Instantiate controllers last (adapters layer)
4. Wire everything together

### Constructor Order

The `ThreadListController` constructor signature after this change:

```typescript
constructor(
    private readonly getSessions: () => Map<string, SessionContext>,
    private readonly terminalGateway: ITerminalPort,
    private readonly createThreadUseCase?: ICreateThreadUseCase,
    private readonly attachToWorktreeUseCase?: IAttachToWorktreeUseCase,  // Position 4
    private readonly attachCodeSquad?: (terminalId: string) => Promise<void>,
    private readonly fileWatchController?: FileWatchController,
    private readonly commentRepository?: ICommentRepository,
    private readonly gitPort?: IGitPort
)
```

### Optional vs Required

The use case is marked as optional (`?`) to maintain backward compatibility and allow graceful degradation if not available.

### Command Registration

Registering a command palette entry is optional but recommended for power users. The primary entry point is the webview button.

## Files to Modify

- `src/extension.ts`
- `package.json` (optional - if command is registered)

## Estimated Time

15 minutes

## Verification Steps

After implementation:

1. Build the extension: `npm run compile`
2. Check for TypeScript errors
3. Launch extension in debug mode (F5)
4. Open a workspace with git worktrees
5. Open Code Squad thread list sidebar
6. Verify "Attach to Worktree" button is visible
7. Click button and verify flow works end-to-end
8. Check console for any errors

## Success Criteria

- Extension compiles without errors
- Extension activates without errors
- Attach to worktree flow is functional
- All dependencies are correctly wired
- No runtime errors when using the feature
