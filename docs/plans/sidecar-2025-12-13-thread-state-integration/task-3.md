# Task 3: Modify ThreadListController.selectThread

## Goal

Update `selectThread` to:
1. Apply thread's whitelist patterns to FileWatchController
2. Filter and set comments for the selected thread
3. Set threadId on the panel's state manager

## Location

`src/adapters/inbound/controllers/ThreadListController.ts`

## Changes

### 1. Add Dependencies to Constructor

```typescript
constructor(
    private readonly getSessions: () => Map<string, SessionContext>,
    private readonly terminalGateway: ITerminalPort,
    private readonly createThreadUseCase?: ICreateThreadUseCase,
    private readonly attachSidecar?: (terminalId: string) => Promise<void>,
    private readonly fileWatchController?: FileWatchController,      // NEW
    private readonly commentRepository?: ICommentRepository,         // NEW
) {}
```

### 2. Add Required Imports

```typescript
import { FileWatchController } from './FileWatchController';
import { ICommentRepository } from '../../../application/ports/outbound/ICommentRepository';
```

### 3. Modify selectThread Method

Update `selectThread` to be async and add thread state handling:

```typescript
/**
 * Select a thread by ID.
 * Applies thread's whitelist patterns and filters comments.
 */
async selectThread(id: string): Promise<void> {
    const sessions = this.getSessions();
    const context = sessions.get(id);

    if (!context) {
        return;
    }

    this.selectedThreadId = id;
    this.webviewProvider?.setSelectedId(id);

    // Set agent info
    const metadata = context.session.agentMetadata;
    if (metadata) {
        context.stateManager.setAgentInfo({
            name: metadata.name,
            status: metadata.status
        });
    }

    // NEW: Apply thread whitelist patterns
    const threadState = context.threadState;
    const patterns = threadState?.whitelistPatterns ?? [];
    this.fileWatchController?.setCurrentThread(id, patterns, threadState?.threadId);

    // NEW: Set threadId on state manager
    context.stateManager.setThreadId(threadState?.threadId);

    // NEW: Filter and set comments for this thread
    if (this.commentRepository && threadState) {
        const comments = await this.commentRepository.findByThreadId(threadState.threadId);
        // Also include comments without threadId (backward compatibility)
        const allComments = await this.commentRepository.findActive();
        const legacyComments = allComments.filter(c => !c.threadId);
        const threadComments = [...comments, ...legacyComments];

        context.stateManager.setComments(threadComments.map(c => ({
            id: c.id,
            file: c.file,
            line: c.line,
            endLine: c.endLine,
            text: c.text,
            isSubmitted: c.isSubmitted,
            codeContext: c.codeContext,
            timestamp: c.timestamp,
        })));
    }

    // Show terminal for this session
    this.terminalGateway.showTerminal(id);

    // Show panel for this session
    const panel = SidecarPanelAdapter.getPanel(id);
    if (panel) {
        panel.show();
    }
}
```

### 4. Update Callers to Handle Async

Update `cycleToNextThread`:

```typescript
async cycleToNextThread(): Promise<void> {
    // ... existing code
    await this.selectThread(sessionIds[nextIndex]);
}
```

Update command registration in `activate`:

```typescript
this.disposables.push(
    vscode.commands.registerCommand('sidecar.selectThread', async (id: string) => {
        await this.selectThread(id);
    })
);
```

Update `createThreadFromInput`:

```typescript
// Refresh and select new thread
this.refresh();
await this.selectThread(result.threadState.terminalId);
```

Update `createThread`:

```typescript
// Refresh and select new thread
this.refresh();
await this.selectThread(result.threadState.terminalId);
```

## Test Scenarios

**TS1: Thread Selection Applies Whitelist**

```typescript
// Given: Thread A with patterns
const threadState = ThreadState.create({
    name: 'Thread A',
    terminalId: 'term-1',
    workingDir: '/workspace',
    whitelistPatterns: ['dist/**'],
});

// When: selectThread is called
await controller.selectThread('term-1');

// Then: FileWatchController.setCurrentThread is called
expect(fileWatchController.setCurrentThread).toHaveBeenCalledWith('term-1', ['dist/**']);
```

**TS2: Thread Selection Filters Comments**

```typescript
// Given: Comments for multiple threads
await commentRepository.save(Comment.create({ file: 'a.ts', line: 1, text: 'A', threadId: 'thread-a' }));
await commentRepository.save(Comment.create({ file: 'b.ts', line: 1, text: 'B', threadId: 'thread-b' }));

// When: selectThread for thread-a
await controller.selectThread('term-a');

// Then: Only thread-a comments are in state
const state = stateManager.getState();
expect(state.comments).toHaveLength(1);
expect(state.comments[0].text).toBe('A');
```

**TS6: Comments Without ThreadId Show Everywhere**

```typescript
// Given: Legacy comment without threadId
await commentRepository.save(Comment.create({ file: 'c.ts', line: 1, text: 'Legacy' }));

// When: selectThread for any thread
await controller.selectThread('term-a');

// Then: Legacy comment is included
const state = stateManager.getState();
expect(state.comments.some(c => c.text === 'Legacy')).toBe(true);
```

## Acceptance Criteria

- [ ] `selectThread` is async
- [ ] Thread whitelist patterns applied via FileWatchController
- [ ] ThreadId set on state manager
- [ ] Comments filtered by threadId
- [ ] Legacy comments (no threadId) included for backward compatibility
- [ ] All callers updated to await selectThread
