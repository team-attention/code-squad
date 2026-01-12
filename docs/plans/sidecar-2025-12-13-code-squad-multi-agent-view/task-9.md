# Task 9: Add All Agents Aggregated View

## Overview

**Layer**: Application & Adapters
**Dependencies**: Task 3, Task 7
**Complexity**: Medium

## Goal

Implement "All Agents" view that aggregates files from all sessions, showing which agent modified each file.

## Files to Modify

| File | Changes |
|------|---------|
| `src/adapters/inbound/controllers/ThreadListController.ts` | Add selectAllAgents method with aggregation logic |
| `src/adapters/inbound/ui/webview/components/sidebar/FileList.ts` | Add agent badge to files |
| `src/adapters/inbound/ui/webview/styles.ts` | Add agent badge styles |
| `src/application/ports/outbound/PanelState.ts` | Add agentBadge to FileInfo (optional) |

## Implementation Details

### Update PanelState.ts - FileInfo

```typescript
export interface FileInfo {
    path: string;
    name: string;
    status: 'modified' | 'added' | 'deleted';
    // NEW: Agent attribution for aggregated view
    agentName?: string;
    /** Color index for agent badge (0-5 for 6-color palette) */
    agentColorIndex?: number;
}
```

### Update ThreadListController.ts

```typescript
/**
 * Select "All Agents" aggregated view.
 * Merges files from all sessions into a single view.
 */
selectAllAgents(): void {
    this.selectedThreadId = null;
    this.treeDataProvider.setSelectedId('all-agents');

    // Aggregate files from all sessions
    const sessions = this.getSessions();
    const aggregatedFiles: FileInfo[] = [];
    const fileAgentMap = new Map<string, string[]>(); // path → agent names

    let colorIndex = 0;
    const agentColorMap = new Map<string, number>(); // agentName → colorIndex

    for (const [terminalId, ctx] of sessions) {
        const agentName = ctx.session.agentMetadata?.name ?? ctx.session.displayName;

        // Assign color to agent
        if (!agentColorMap.has(agentName)) {
            agentColorMap.set(agentName, colorIndex % 6);
            colorIndex++;
        }

        const files = ctx.stateManager.getState().sessionFiles;
        for (const file of files) {
            // Track which agents modified this file
            const agents = fileAgentMap.get(file.path) || [];
            if (!agents.includes(agentName)) {
                agents.push(agentName);
            }
            fileAgentMap.set(file.path, agents);
        }
    }

    // Build aggregated file list
    for (const [path, agents] of fileAgentMap) {
        const firstAgent = agents[0];
        aggregatedFiles.push({
            path,
            name: path.split('/').pop() ?? path,
            status: 'modified', // simplified - could be more accurate
            agentName: agents.length > 1 ? `${agents.length} agents` : firstAgent,
            agentColorIndex: agents.length > 1 ? -1 : agentColorMap.get(firstAgent) ?? 0
        });
    }

    // Find any session's state manager to update (or use a shared one)
    // For now, broadcast to all panels
    for (const ctx of sessions.values()) {
        ctx.stateManager.setAggregatedView(true);
        ctx.stateManager.setAgentInfo(undefined); // Clear individual agent info
        // Note: In aggregated view, we'd need a way to show aggregated files
        // This might require a new state manager method or special handling
    }
}
```

### Update FileList.ts

```typescript
function renderFileItem(file: FileInfo, isSelected: boolean): string {
    const statusClass = `file-status--${file.status}`;
    const selectedClass = isSelected ? 'file-item--selected' : '';

    // Agent badge for aggregated view
    let agentBadge = '';
    if (file.agentName) {
        const colorClass = file.agentColorIndex === -1
            ? 'agent-badge--multi'
            : `agent-badge--color-${file.agentColorIndex}`;
        agentBadge = `<span class="agent-badge ${colorClass}">${escapeHtml(file.agentName)}</span>`;
    }

    return `
        <div class="file-item ${selectedClass}" data-path="${escapeHtml(file.path)}">
            <span class="file-icon ${statusClass}"></span>
            <span class="file-name">${escapeHtml(file.name)}</span>
            ${agentBadge}
        </div>
    `;
}
```

### Update styles.ts

```css
/* Agent Badge Styles */
.agent-badge {
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 3px;
    margin-left: auto;
    white-space: nowrap;
}

.agent-badge--multi {
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
}

/* 6-color palette for agent badges */
.agent-badge--color-0 {
    background: rgba(66, 165, 245, 0.2);
    color: #42a5f5;
}

.agent-badge--color-1 {
    background: rgba(102, 187, 106, 0.2);
    color: #66bb6a;
}

.agent-badge--color-2 {
    background: rgba(255, 167, 38, 0.2);
    color: #ffa726;
}

.agent-badge--color-3 {
    background: rgba(171, 71, 188, 0.2);
    color: #ab47bc;
}

.agent-badge--color-4 {
    background: rgba(239, 83, 80, 0.2);
    color: #ef5350;
}

.agent-badge--color-5 {
    background: rgba(38, 198, 218, 0.2);
    color: #26c6da;
}
```

## Test Scenarios

### TS-9.1: Aggregated File List

**Given**: 2 sessions:
- "Backend Agent" with files: [User.ts, Auth.ts, DB.ts]
- "Frontend Agent" with files: [App.tsx, Header.tsx]
**When**: "All Agents" is selected
**Then**:
- File list shows 5 files total
- Each file has agent badge

### TS-9.2: Overlapping Files

**Given**: 2 sessions both modifying "Config.ts"
- "Backend Agent": [Config.ts, Server.ts]
- "Frontend Agent": [Config.ts, App.tsx]
**When**: "All Agents" is selected
**Then**:
- Config.ts shows badge "2 agents"
- Badge has multi-agent style (agent-badge--multi)

### TS-9.3: Agent Color Consistency

**Given**: "Backend Agent" assigned color index 0
**When**: Multiple files from "Backend Agent" are displayed
**Then**: All files have same color (agent-badge--color-0)

### TS-9.4: Switch from Aggregated to Single Agent

**Given**: Currently in "All Agents" view
**When**: selectThread("terminal-1") is called
**Then**:
- isAggregatedView is set to false
- agentInfo is set to that agent's info
- File list shows only that agent's files

### TS-9.5: Empty Sessions

**Given**: No active sessions
**When**: "All Agents" is selected
**Then**: Empty state shown, no crash

### TS-9.6: Agent Badge XSS Prevention

**Given**: Agent named "<script>alert(1)</script>"
**When**: File list renders
**Then**: Badge text is escaped, no script execution

## Acceptance Criteria

- [ ] FileInfo has optional agentName and agentColorIndex fields
- [ ] ThreadListController.selectAllAgents() aggregates files
- [ ] Files modified by multiple agents show "N agents" badge
- [ ] Agent badges use 6-color palette
- [ ] Multi-agent badge uses neutral color
- [ ] FileList.ts renders agent badges when present
- [ ] CSS styles added for agent badges
- [ ] Switching back to single agent clears aggregated view
- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
