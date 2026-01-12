# Task 2: Create ThreadTreeDataProvider

## Overview

**Layer**: Adapters (inbound/ui)
**Dependencies**: Task 1
**Complexity**: Medium

## Goal

Implement VSCode TreeDataProvider for displaying agent threads in the Activity Bar.

## Files to Create

| File | Description |
|------|-------------|
| `src/adapters/inbound/ui/ThreadTreeDataProvider.ts` | TreeDataProvider implementation |

## Implementation Details

### ThreadTreeDataProvider.ts

```typescript
import * as vscode from 'vscode';
import { SessionContext } from '../../../application/ports/outbound/SessionContext';
import { AgentStatus } from '../../../domain/entities/AISession';

export type ThreadTreeItemType = 'all-agents' | 'agent';

export interface ThreadTreeItem {
    id: string;
    type: ThreadTreeItemType;
    label: string;
    status?: AgentStatus;
    fileCount: number;
    terminalId?: string;
}

export class ThreadTreeDataProvider implements vscode.TreeDataProvider<ThreadTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<ThreadTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private selectedId: string | null = null;

    constructor(
        private readonly getSessions: () => Map<string, SessionContext>
    ) {}

    setSelectedId(id: string | null): void {
        this.selectedId = id;
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ThreadTreeItem): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            element.label,
            vscode.TreeItemCollapsibleState.None
        );

        // Icon based on status
        if (element.type === 'all-agents') {
            treeItem.iconPath = new vscode.ThemeIcon('layers');
        } else {
            treeItem.iconPath = this.getStatusIcon(element.status ?? 'idle');
        }

        // Description shows file count
        treeItem.description = `${element.fileCount} files`;

        // Context value for conditional commands
        treeItem.contextValue = element.type;

        // Command to select thread
        treeItem.command = {
            command: 'sidecar.selectThread',
            title: 'Select Thread',
            arguments: [element.id]
        };

        // Highlight selected
        if (element.id === this.selectedId) {
            treeItem.description = `${element.fileCount} files (selected)`;
        }

        return treeItem;
    }

    getChildren(element?: ThreadTreeItem): Thenable<ThreadTreeItem[]> {
        // Root level only (no nesting)
        if (element) {
            return Promise.resolve([]);
        }

        const sessions = this.getSessions();
        const items: ThreadTreeItem[] = [];

        // "All Agents" item
        let totalFiles = 0;
        for (const ctx of sessions.values()) {
            totalFiles += ctx.stateManager.getState().sessionFiles.length;
        }

        items.push({
            id: 'all-agents',
            type: 'all-agents',
            label: 'All Agents',
            fileCount: totalFiles
        });

        // Individual agent items
        for (const [terminalId, ctx] of sessions) {
            const session = ctx.session;
            const metadata = session.agentMetadata;
            const fileCount = ctx.stateManager.getState().sessionFiles.length;

            items.push({
                id: terminalId,
                type: 'agent',
                label: metadata?.name ?? session.displayName,
                status: metadata?.status ?? 'idle',
                fileCount,
                terminalId
            });
        }

        return Promise.resolve(items);
    }

    private getStatusIcon(status: AgentStatus): vscode.ThemeIcon {
        switch (status) {
            case 'working':
                return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.green'));
            case 'waiting':
                return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.yellow'));
            case 'error':
                return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.red'));
            case 'idle':
            default:
                return new vscode.ThemeIcon('circle-outline');
        }
    }

    dispose(): void {
        this._onDidChangeTreeData.dispose();
    }
}
```

## Test Scenarios

### TS-2.1: Empty Sessions

**Given**: No active sessions in AIDetectionController
**When**: getChildren() is called with no element
**Then**:
- Return array with single "All Agents" item
- "All Agents" fileCount should be 0

### TS-2.2: Multiple Sessions

**Given**: 3 active sessions:
- Session 1: "Backend Agent" with status 'working', 3 files
- Session 2: "Frontend Agent" with status 'idle', 2 files
- Session 3: "Database Agent" with status 'waiting', 1 file
**When**: getChildren() is called
**Then**:
- Return 4 items (1 "All Agents" + 3 agents)
- "All Agents" fileCount should be 6
- Each agent item has correct label, status, fileCount

### TS-2.3: Status Icons

**Given**: Session with status 'working'
**When**: getTreeItem() is called for that session
**Then**: TreeItem iconPath should be green circle-filled ThemeIcon

### TS-2.4: File Count Badge

**Given**: Session with 5 files changed
**When**: getTreeItem() is called
**Then**: TreeItem description should be "5 files"

### TS-2.5: Selected Item Highlight

**Given**: Thread with id "terminal-1" is selected
**When**: getTreeItem() is called for that thread
**Then**: description should include "(selected)"

### TS-2.6: Refresh on Session Change

**Given**: ThreadTreeDataProvider with 2 sessions
**When**: refresh() is called
**Then**: onDidChangeTreeData should fire

## Acceptance Criteria

- [ ] ThreadTreeDataProvider implements vscode.TreeDataProvider<ThreadTreeItem>
- [ ] getChildren() returns "All Agents" + individual agent items
- [ ] getTreeItem() returns TreeItem with correct icon, label, description
- [ ] Status icons correctly mapped (green=working, yellow=waiting, red=error, outline=idle)
- [ ] refresh() triggers onDidChangeTreeData event
- [ ] setSelectedId() updates selection and refreshes
- [ ] dispose() cleans up event emitter
- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
