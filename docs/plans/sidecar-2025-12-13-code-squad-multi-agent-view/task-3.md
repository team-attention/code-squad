# Task 3: Create ThreadListController

## Overview

**Layer**: Adapters (inbound/controllers)
**Dependencies**: Task 2
**Complexity**: Medium

## Goal

Implement controller that manages thread selection and coordinates terminal/panel switching.

## Files to Create

| File | Description |
|------|-------------|
| `src/adapters/inbound/controllers/ThreadListController.ts` | Thread list controller |

## Implementation Details

### ThreadListController.ts

```typescript
import * as vscode from 'vscode';
import { SessionContext } from '../../../application/ports/outbound/SessionContext';
import { ThreadTreeDataProvider, ThreadTreeItem } from '../ui/ThreadTreeDataProvider';
import { SidecarPanelAdapter } from '../ui/SidecarPanelAdapter';

export class ThreadListController {
    private treeDataProvider: ThreadTreeDataProvider;
    private treeView: vscode.TreeView<ThreadTreeItem>;
    private selectedThreadId: string | null = null; // null = "All Agents"
    private disposables: vscode.Disposable[] = [];

    constructor(
        private readonly getSessions: () => Map<string, SessionContext>,
        private readonly terminalGateway: {
            showTerminal(terminalId: string): void;
        }
    ) {
        this.treeDataProvider = new ThreadTreeDataProvider(getSessions);
    }

    activate(context: vscode.ExtensionContext): void {
        // Register tree view
        this.treeView = vscode.window.createTreeView('sidecarThreadList', {
            treeDataProvider: this.treeDataProvider,
            showCollapseAll: false
        });

        context.subscriptions.push(this.treeView);
        this.disposables.push(this.treeView);

        // Register select command
        this.disposables.push(
            vscode.commands.registerCommand('sidecar.selectThread', (id: string) => {
                this.selectThread(id);
            })
        );

        // Set context for keyboard shortcut
        this.updateContextKey();
    }

    /**
     * Select a thread by ID.
     * @param id Thread ID or 'all-agents' for aggregated view
     */
    selectThread(id: string): void {
        if (id === 'all-agents') {
            this.selectedThreadId = null;
            this.treeDataProvider.setSelectedId('all-agents');
            // TODO: Task 9 - Show aggregated view
            return;
        }

        const sessions = this.getSessions();
        const context = sessions.get(id);

        if (!context) {
            return;
        }

        this.selectedThreadId = id;
        this.treeDataProvider.setSelectedId(id);

        // Show terminal for this session
        this.terminalGateway.showTerminal(id);

        // Show panel for this session
        const panel = SidecarPanelAdapter.getPanel(id);
        if (panel) {
            panel.show();
        }
    }

    /**
     * Get currently selected thread ID.
     * Returns null if "All Agents" is selected.
     */
    getSelectedThreadId(): string | null {
        return this.selectedThreadId;
    }

    /**
     * Cycle to next thread.
     * Order: All Agents → Agent 1 → Agent 2 → ... → All Agents
     */
    cycleToNextThread(): void {
        const sessions = this.getSessions();
        const sessionIds = Array.from(sessions.keys());

        if (sessionIds.length === 0) {
            return;
        }

        // Build order: all-agents, then session IDs
        const order = ['all-agents', ...sessionIds];
        const currentId = this.selectedThreadId ?? 'all-agents';
        const currentIndex = order.indexOf(currentId);
        const nextIndex = (currentIndex + 1) % order.length;

        this.selectThread(order[nextIndex]);
    }

    /**
     * Refresh thread list.
     * Call when sessions change.
     */
    refresh(): void {
        this.treeDataProvider.refresh();
        this.updateContextKey();
    }

    /**
     * Update context key for keyboard shortcut condition.
     */
    private updateContextKey(): void {
        const sessions = this.getSessions();
        vscode.commands.executeCommand(
            'setContext',
            'sidecar.hasMultipleThreads',
            sessions.size > 1
        );
    }

    dispose(): void {
        for (const d of this.disposables) {
            d.dispose();
        }
        this.treeDataProvider.dispose();
    }
}
```

## Test Scenarios

### TS-3.1: Thread Selection

**Given**: Multiple active sessions:
- Session "terminal-1": "Backend Agent"
- Session "terminal-2": "Frontend Agent"
**When**: selectThread("terminal-1") is called
**Then**:
- selectedThreadId should be "terminal-1"
- terminalGateway.showTerminal("terminal-1") should be called
- SidecarPanelAdapter.getPanel("terminal-1").show() should be called
- treeDataProvider.setSelectedId("terminal-1") should be called

### TS-3.2: All Agents Selection

**Given**: Multiple active sessions
**When**: selectThread("all-agents") is called
**Then**:
- selectedThreadId should be null
- treeDataProvider.setSelectedId("all-agents") should be called
- No terminal or panel switch

### TS-3.3: Session Added

**Given**: ThreadListController observing sessions
**When**: refresh() is called after new session added
**Then**: treeDataProvider.refresh() should be called

### TS-3.4: Cycle to Next Thread

**Given**: 2 sessions, "all-agents" currently selected
**When**: cycleToNextThread() is called
**Then**: First session should be selected

### TS-3.5: Cycle Wraps Around

**Given**: 2 sessions, last session currently selected
**When**: cycleToNextThread() is called
**Then**: "all-agents" should be selected

### TS-3.6: Context Key for Keyboard Shortcut

**Given**: 3 active sessions
**When**: refresh() is called
**Then**: setContext('sidecar.hasMultipleThreads', true) should be executed

### TS-3.7: Invalid Thread Selection

**Given**: Sessions map without "terminal-99"
**When**: selectThread("terminal-99") is called
**Then**: No crash, no state change

## Acceptance Criteria

- [ ] ThreadListController creates ThreadTreeDataProvider
- [ ] activate() registers TreeView and selectThread command
- [ ] selectThread() updates selection and shows terminal/panel
- [ ] cycleToNextThread() cycles through threads in order
- [ ] refresh() updates tree and context key
- [ ] Context key sidecar.hasMultipleThreads correctly set
- [ ] dispose() cleans up all subscriptions
- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
