# Task 10: Add Thread Cycling Keyboard Shortcut

## Overview

**Layer**: Extension
**Dependencies**: Task 5
**Complexity**: Low

## Goal

Implement Cmd+Shift+A keyboard shortcut to cycle through threads (All Agents → Agent 1 → Agent 2 → ... → All Agents).

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Already done in Task 4 - verify keybinding |
| `src/extension.ts` | Already done in Task 5 - verify command registration |
| `src/adapters/inbound/controllers/ThreadListController.ts` | Verify cycleToNextThread() implementation |

## Implementation Details

This task verifies and tests the keyboard shortcut implementation from Tasks 4 and 5.

### Verify package.json (from Task 4)

```json
{
  "keybindings": [
    {
      "command": "sidecar.cycleThreads",
      "key": "ctrl+shift+a",
      "mac": "cmd+shift+a",
      "when": "sidecar.hasMultipleThreads"
    }
  ]
}
```

### Verify extension.ts (from Task 5)

```typescript
context.subscriptions.push(
    vscode.commands.registerCommand('sidecar.cycleThreads', () => {
        threadListController.cycleToNextThread();
    })
);
```

### Verify ThreadListController.cycleToNextThread() (from Task 3)

```typescript
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
```

## Test Scenarios

### TS-10.1: Cycle Through Threads

**Given**: 3 active threads:
- All Agents (currently selected)
- Backend Agent
- Frontend Agent
**When**: Cmd+Shift+A is pressed
**Then**: Backend Agent is selected

### TS-10.2: Cycle Wraps to All Agents

**Given**: 2 active threads, Frontend Agent (last) is selected
**When**: Cmd+Shift+A is pressed
**Then**: "All Agents" is selected

### TS-10.3: Keybinding Only Active with Multiple Threads

**Given**: Only 1 active session (sidecar.hasMultipleThreads = false)
**When**: Cmd+Shift+A is pressed
**Then**: Nothing happens (keybinding condition not met)

### TS-10.4: Keybinding Active with Multiple Threads

**Given**: 2+ active sessions (sidecar.hasMultipleThreads = true)
**When**: Cmd+Shift+A is pressed
**Then**: cycleToNextThread() is called

### TS-10.5: No Threads (Edge Case)

**Given**: No active sessions
**When**: cycleToNextThread() is called directly (via command palette)
**Then**: No crash, nothing happens

### TS-10.6: Terminal and Panel Switch on Cycle

**Given**: 2 threads, Backend Agent selected
**When**: Cmd+Shift+A cycles to Frontend Agent
**Then**:
- Frontend Agent's terminal is shown
- Frontend Agent's Sidecar panel is shown
- Tree view selection updates

### TS-10.7: Visual Feedback in Thread List

**Given**: Thread cycling occurs
**When**: Selection moves to new thread
**Then**: Thread list TreeView highlights new selection

## Acceptance Criteria

- [ ] Cmd+Shift+A (Mac) / Ctrl+Shift+A (Windows/Linux) cycles threads
- [ ] Shortcut only active when sidecar.hasMultipleThreads is true
- [ ] Cycling order: All Agents → Agent 1 → Agent 2 → ... → All Agents
- [ ] Terminal switches to selected agent's terminal
- [ ] Panel shows selected agent's changes
- [ ] Thread list selection updates visually
- [ ] No crash with 0 or 1 threads
- [ ] `npm run compile` succeeds
- [ ] Manual test: keyboard shortcut works end-to-end
