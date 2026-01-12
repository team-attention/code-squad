# Task 8: Update SidecarPanelAdapter Header

## Overview

**Layer**: Adapters (inbound/ui)
**Dependencies**: Task 6, Task 7
**Complexity**: Medium

## Goal

Display agent name and status in Sidecar panel header when in multi-agent mode.

## Files to Modify

| File | Changes |
|------|---------|
| `src/adapters/inbound/ui/webview/components/sidebar/Sidebar.ts` | Show agent name in header |
| `src/adapters/inbound/ui/webview/styles.ts` | Add agent header styles |

## Implementation Details

### Update Sidebar.ts

Modify the header rendering to include agent info:

```typescript
// In Sidebar.ts render function

function renderHeader(state: PanelState): string {
    const { agentInfo, isAggregatedView, aiStatus } = state;

    // Determine header content
    let agentDisplay = '';
    if (isAggregatedView) {
        agentDisplay = `
            <div class="agent-header agent-header--aggregated">
                <span class="agent-icon">$(layers)</span>
                <span class="agent-name">All Agents</span>
            </div>
        `;
    } else if (agentInfo) {
        const statusClass = `agent-status--${agentInfo.status}`;
        const statusIcon = getStatusIcon(agentInfo.status);
        agentDisplay = `
            <div class="agent-header">
                <span class="agent-status ${statusClass}">${statusIcon}</span>
                <span class="agent-name">${escapeHtml(agentInfo.name)}</span>
            </div>
        `;
    }

    return `
        <div class="sidebar-header">
            <div class="header-title">
                ${agentDisplay || 'Sidecar'}
                ${aiStatus.active ? `<span class="ai-badge">${aiStatus.type}</span>` : ''}
            </div>
        </div>
    `;
}

function getStatusIcon(status: AgentStatus): string {
    switch (status) {
        case 'working': return '●'; // green
        case 'waiting': return '●'; // yellow
        case 'error': return '●';   // red
        case 'idle':
        default: return '○';        // gray outline
    }
}
```

### Update styles.ts

Add CSS for agent header:

```css
/* Agent Header Styles */
.agent-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
}

.agent-header--aggregated {
    color: var(--vscode-descriptionForeground);
}

.agent-status {
    font-size: 10px;
    line-height: 1;
}

.agent-status--working {
    color: var(--vscode-charts-green);
}

.agent-status--waiting {
    color: var(--vscode-charts-yellow);
}

.agent-status--error {
    color: var(--vscode-charts-red);
}

.agent-status--idle {
    color: var(--vscode-descriptionForeground);
}

.agent-name {
    font-weight: 500;
    font-size: 12px;
}

.agent-icon {
    font-size: 14px;
    opacity: 0.8;
}
```

## Test Scenarios

### TS-8.1: Agent Name Display

**Given**: PanelState with agentInfo = { name: "Backend Agent", status: "working" }
**When**: Sidebar header renders
**Then**:
- Header shows "● Backend Agent"
- Status indicator is green (working)

### TS-8.2: Aggregated View Header

**Given**: PanelState with isAggregatedView = true
**When**: Sidebar header renders
**Then**:
- Header shows "All Agents" with layers icon
- No status indicator

### TS-8.3: No Agent Info (Single Session Mode)

**Given**: PanelState with agentInfo = undefined, isAggregatedView = false
**When**: Sidebar header renders
**Then**: Header shows "Sidecar" (default)

### TS-8.4: Status Icon Colors

**Given**: PanelState with agentInfo.status = "waiting"
**When**: Sidebar header renders
**Then**: Status indicator has yellow color (agent-status--waiting class)

### TS-8.5: Error Status Display

**Given**: PanelState with agentInfo.status = "error"
**When**: Sidebar header renders
**Then**: Status indicator has red color (agent-status--error class)

### TS-8.6: HTML Escaping

**Given**: PanelState with agentInfo.name = "<script>alert('xss')</script>"
**When**: Sidebar header renders
**Then**: Name is escaped, no script execution

## Acceptance Criteria

- [ ] Sidebar.ts renders agent name when agentInfo is present
- [ ] Sidebar.ts renders "All Agents" when isAggregatedView is true
- [ ] Sidebar.ts falls back to "Sidecar" when no agent info
- [ ] Status icons correct: working=●green, waiting=●yellow, error=●red, idle=○gray
- [ ] CSS classes defined in styles.ts
- [ ] Agent name is HTML-escaped for XSS prevention
- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] Webview renders without errors
