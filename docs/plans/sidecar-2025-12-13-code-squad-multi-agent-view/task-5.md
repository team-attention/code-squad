# Task 5: Wire ThreadListController in extension.ts

## Overview

**Layer**: Extension (entry point)
**Dependencies**: Task 3, Task 4
**Complexity**: Low

## Goal

Create and activate ThreadListController in extension activation, wire it with AIDetectionController sessions.

## Files to Modify

| File | Changes |
|------|---------|
| `src/extension.ts` | Create ThreadListController, activate it, wire refresh on session changes |

## Implementation Details

### Update extension.ts

```typescript
import { ThreadListController } from './adapters/inbound/controllers/ThreadListController';

export function activate(context: vscode.ExtensionContext) {
    // ... existing code ...

    // ===== Adapters Layer - Controllers =====
    const aiDetectionController = new AIDetectionController(
        // ... existing params ...
    );

    // Thread List Controller (after AIDetectionController)
    const threadListController = new ThreadListController(
        () => aiDetectionController.getSessions(),
        terminalGateway
    );
    threadListController.activate(context);

    // Register cycleThreads command
    context.subscriptions.push(
        vscode.commands.registerCommand('sidecar.cycleThreads', () => {
            threadListController.cycleToNextThread();
        })
    );

    // Connect AIDetectionController to notify ThreadListController on session changes
    aiDetectionController.setOnSessionChange(() => {
        threadListController.refresh();
    });

    // ... existing code ...

    // Add to cleanup
    context.subscriptions.push({ dispose: () => threadListController.dispose() });
}
```

### Update AIDetectionController.ts

Add callback mechanism for session changes:

```typescript
export class AIDetectionController {
    // ... existing code ...
    private onSessionChangeCallback?: () => void;

    setOnSessionChange(callback: () => void): void {
        this.onSessionChangeCallback = callback;
    }

    private notifySessionChange(): void {
        this.onSessionChangeCallback?.();
    }

    // Call notifySessionChange in:
    // - activateSidecar() after session created
    // - flushSession() after session deleted
}
```

## Test Scenarios

### TS-5.1: Controller Activation

**Given**: Extension activates
**When**: activate() completes
**Then**:
- ThreadListController is created
- threadListController.activate() is called
- TreeView is registered

### TS-5.2: TreeView Registration

**Given**: Extension activates
**When**: Checking vscode.window views
**Then**: sidecarThreadList TreeView is available

### TS-5.3: CycleThreads Command Registered

**Given**: Extension activated
**When**: sidecar.cycleThreads command executed
**Then**: threadListController.cycleToNextThread() is called

### TS-5.4: Session Change Notification

**Given**: AIDetectionController with ThreadListController connected
**When**: New AI session created via activateSidecar()
**Then**: threadListController.refresh() is called

### TS-5.5: Session Removal Notification

**Given**: AIDetectionController with active session
**When**: Session is flushed via flushSession()
**Then**: threadListController.refresh() is called

### TS-5.6: Cleanup on Deactivate

**Given**: Extension is deactivating
**When**: dispose() is called
**Then**: threadListController.dispose() is called

## Acceptance Criteria

- [ ] ThreadListController created in activate()
- [ ] ThreadListController.activate() called with context
- [ ] cycleThreads command registered
- [ ] AIDetectionController has setOnSessionChange() method
- [ ] notifySessionChange() called in activateSidecar()
- [ ] notifySessionChange() called in flushSession()
- [ ] ThreadListController disposed on extension deactivation
- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] Extension activates without errors
