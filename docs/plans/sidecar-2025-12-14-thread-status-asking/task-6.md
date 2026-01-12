# Task 6: Update Webview UI

## Goal

Update thread list webview to display status icons for each thread.

## Files

- `src/adapters/inbound/ui/ThreadListWebviewProvider.ts`

## Changes

### Status Icon CSS

Add status icon styles to webview HTML:

```css
.thread-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 12px;
}

.status-inactive {
  color: var(--vscode-disabledForeground);
}

.status-idle {
  color: var(--vscode-foreground);
}

.status-working {
  color: var(--vscode-charts-green);
  animation: spin 1s linear infinite;
}

.status-waiting {
  color: var(--vscode-charts-yellow);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Status Icon Mapping

```typescript
function getStatusIcon(status: AgentStatus): string {
  switch (status) {
    case 'inactive': return '○';     // Empty circle
    case 'idle': return '─';         // Dash
    case 'working': return '⟳';      // Rotating arrow (animated via CSS)
    case 'waiting': return '?';      // Question mark
    default: return '○';
  }
}
```

### Thread Item Rendering

Update thread item HTML template:

```html
<div class="thread-item ${isSelected ? 'selected' : ''}">
  <span class="thread-status status-${status}" title="${getStatusTitle(status)}">
    ${getStatusIcon(status)}
  </span>
  <span class="thread-name">${name}</span>
  <span class="thread-file-count">${fileCount}</span>
</div>
```

### Status Title Mapping

```typescript
function getStatusTitle(status: AgentStatus): string {
  switch (status) {
    case 'inactive': return 'No AI agent';
    case 'idle': return 'AI idle - ready for input';
    case 'working': return 'AI working...';
    case 'waiting': return 'AI waiting for answer';
    default: return '';
  }
}
```

### Updated buildThreadList

Ensure status is properly passed through:

```typescript
private buildThreadList(): ThreadInfo[] {
  const threads: ThreadInfo[] = [];
  const sessions = this.getSessions();

  for (const [terminalId, ctx] of sessions) {
    const metadata = ctx.session.agentMetadata;
    const threadState = this.threadDatabase.getThreadByTerminalId(terminalId);

    threads.push({
      id: terminalId,
      name: threadState?.name ?? metadata?.name ?? ctx.session.displayName,
      status: metadata?.status ?? 'inactive', // Default to inactive
      fileCount: ctx.stateManager.getState().sessionFiles.length,
      isSelected: this.selectedId === terminalId,
    });
  }

  return threads;
}
```

## Test Scenarios

### TS-6.1: Inactive status icon displayed
- **Given**: Thread with `inactive` status
- **When**: Thread list rendered
- **Then**: Shows empty circle icon (○)

### TS-6.2: Working status animated
- **Given**: Thread with `working` status
- **When**: Thread list rendered
- **Then**: Shows rotating arrow icon with animation

### TS-6.3: Waiting status highlighted
- **Given**: Thread with `waiting` status
- **When**: Thread list rendered
- **Then**: Shows question mark in yellow color

### TS-6.4: Status tooltip
- **Given**: Any thread in list
- **When**: User hovers over status icon
- **Then**: Tooltip shows status description

### TS-6.5: Status updates without page refresh
- **Given**: Thread list visible
- **When**: Status changes detected
- **Then**: Icon updates without full refresh

## Visual Reference

```
┌─────────────────────────────────┐
│ Threads                      +  │
├─────────────────────────────────┤
│ ⟳ fix-login-bug           3    │  ← working (green, spinning)
│ ? add-dark-mode            1    │  ← waiting (yellow)
│ ─ refactor-api             5    │  ← idle (default)
│ ○ new-feature              0    │  ← inactive (gray)
└─────────────────────────────────┘
```

## Notes

- Use VSCode CSS variables for consistent theming
- Animation should be subtle, not distracting
- Ensure accessibility (screen reader support via title attribute)
- Status icon is leftmost element for quick scanning
