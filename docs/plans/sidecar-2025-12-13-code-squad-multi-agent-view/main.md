# Implementation Plan: Code Squad Multi-Agent View

## Overview

This plan implements a unified monitoring and interaction interface for multiple AI agents running simultaneously in Code Squad sessions. The feature extends Sidecar's existing per-terminal session architecture to support multi-agent scenarios.

**Slug**: `sidecar-2025-12-13-code-squad-multi-agent-view`
**Spec**: `docs/specs/sidecar-2025-12-13-code-squad-multi-agent-view.md`
**Size**: LARGE (10 tasks across 2 phases)

## Scope Summary

| Phase | Description | Tasks |
|-------|-------------|-------|
| Phase 1 | Thread List TreeView Panel | Task 1-5 |
| Phase 2 | Multi-Agent State Management & Panel Updates | Task 6-10 |

Phase 3 (Agent Attribution) and Phase 4 (Code Squad IPC) are noted for future work as they depend on the Code Squad coordinator protocol definition.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Thread List UI | VSCode TreeView (Activity Bar) | Native VSCode component, lightweight, persistent visibility |
| Agent Status Storage | Extend SessionContext with AgentMetadata | Reuses existing per-terminal session architecture |
| Panel Coordination | Event-based with central ThreadListController | Clean separation, follows existing controller pattern |
| Terminal-Panel Switching | Terminal focus triggers panel switch | Maintains existing behavior, adds thread selection |
| Multi-agent state | New `IAgentMetadataPort` outbound port | Follows hexagonal architecture pattern |
| Aggregated View | Virtual "all-agents" selection state | No file duplication, computed view from multiple sessions |

## Technical Design

### Current Architecture (Key Components)

```
AIDetectionController
├── sessions: Map<terminalId, SessionContext>
├── activateSidecar(type, terminal) → creates session
├── flushSession(terminalId) → cleanup
└── handleTerminalFocus → shows associated panel

SessionContext
├── terminalId: string
├── session: AISession (type, terminalId, startTime)
├── workspaceRoot: string
├── stateManager: IPanelStateManager
├── snapshotRepository, useCases...
└── disposePanel: () => void

SidecarPanelAdapter
├── activePanels: Map<terminalId, adapter>
├── createNew(context, terminalId, workspaceRoot)
├── setUseCases(...) → wire message handlers
└── render(state: PanelState)
```

### New Components

```
ThreadListController (adapters/inbound/controllers/)
├── treeDataProvider: ThreadTreeDataProvider
├── sessions: reference to AIDetectionController.sessions
├── selectedThreadId: string | null  // null = "All Agents"
├── onThreadSelected(terminalId) → emits event
└── refreshThreadList() → updates tree

ThreadTreeDataProvider (adapters/inbound/ui/)
├── implements vscode.TreeDataProvider<ThreadTreeItem>
├── getChildren() → builds tree from sessions
├── getTreeItem(element) → TreeItem with icons
└── refresh() → _onDidChangeTreeData.fire()

AgentSession (domain/entities/) - extends AISession
├── agentName: string  // "Backend Agent", "Frontend Agent"
├── agentRole?: string // optional role description
├── status: AgentStatus  // 'working' | 'idle' | 'waiting' | 'error'
└── fileCount: number  // changed file count

AgentMetadata (domain/entities/) - value object
├── name: string
├── role?: string
├── status: AgentStatus
└── fileCount: number
```

### Data Flow

```
Terminal Focus / Thread Click
      │
ThreadListController.selectThread(terminalId)
      │
VscodeTerminalGateway.showTerminal(terminalId)
      │
SidecarPanelAdapter.show() for that terminalId
      │
PanelState rendered with agent context
```

### State Flow for Multi-Agent

```
AIDetectionController maintains sessions Map (unchanged)
      │
ThreadListController observes sessions (via getter)
      │
ThreadTreeDataProvider.refresh() on session change
      │
UI shows thread list with status indicators
```

### Extended PanelState

```typescript
// New fields in PanelState
interface PanelState {
  // ... existing fields ...
  agentName?: string;        // Current agent name (for header display)
  agentStatus?: AgentStatus; // Current agent's status
}
```

## Task Overview

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1 | Create AgentSession entity with metadata | None |
| 2 | Create ThreadTreeDataProvider | Task 1 |
| 3 | Create ThreadListController | Task 2 |
| 4 | Register TreeView in package.json | Task 3 |
| 5 | Wire ThreadListController in extension.ts | Task 3, 4 |
| 6 | Extend PanelState with agent fields | None |
| 7 | Update PanelStateManager for agent metadata | Task 6 |
| 8 | Update SidecarPanelAdapter header with agent name | Task 6, 7 |
| 9 | Add "All Agents" aggregated view | Task 3, 7 |
| 10 | Add thread cycling keyboard shortcut | Task 5 |

## Dependency Graph

```
Task 1 (AgentSession) → Task 2 (TreeDataProvider) → Task 3 (ThreadListController)
                                                            │
                                                            ├→ Task 4 (package.json)
                                                            │
                                                            ├→ Task 5 (extension.ts wiring)
                                                            │
                                                            └→ Task 9 (All Agents view)

Task 6 (PanelState) → Task 7 (StateManager) → Task 8 (Panel header)
                                            └→ Task 9 (All Agents view)

Task 5 + Task 9 → Task 10 (keyboard shortcut)
```

## Layer Changes

```
src/
├── domain/
│   └── entities/
│       ├── AISession.ts            # Task 1: Extend with AgentSession
│       └── AgentMetadata.ts        # Task 1: New value object
│
├── application/
│   ├── ports/
│   │   └── outbound/
│   │       ├── PanelState.ts       # Task 6: Add agent fields
│   │       └── SessionContext.ts   # Task 1: Add agentMetadata field
│   └── services/
│       ├── IPanelStateManager.ts   # Task 7: Add agent methods
│       └── PanelStateManager.ts    # Task 7: Implement agent methods
│
├── adapters/
│   └── inbound/
│       ├── controllers/
│       │   └── ThreadListController.ts    # Task 3: New controller
│       └── ui/
│           ├── ThreadTreeDataProvider.ts  # Task 2: New tree provider
│           └── SidecarPanelAdapter.ts     # Task 8: Header update
│
└── extension.ts                           # Task 5: Wiring
```

## Package.json Changes (Task 4)

```json
{
  "contributes": {
    "views": {
      "sidecar": [
        {
          "id": "sidecarThreadList",
          "name": "Threads",
          "icon": "$(symbol-class)"
        }
      ]
    },
    "viewsContainers": {
      "activitybar": [
        {
          "id": "sidecar",
          "title": "Sidecar",
          "icon": "assets/sidecar-icon.svg"
        }
      ]
    },
    "commands": [
      {
        "command": "sidecar.selectThread",
        "title": "Sidecar: Select Thread"
      },
      {
        "command": "sidecar.cycleThreads",
        "title": "Sidecar: Cycle Through Threads"
      }
    ],
    "keybindings": [
      {
        "command": "sidecar.cycleThreads",
        "key": "ctrl+shift+a",
        "mac": "cmd+shift+a",
        "when": "sidecar.hasMultipleThreads"
      }
    ]
  }
}
```

## Files

- [Task 1: Create AgentSession Entity](./task-1.md)
- [Task 2: Create ThreadTreeDataProvider](./task-2.md)
- [Task 3: Create ThreadListController](./task-3.md)
- [Task 4: Register TreeView in package.json](./task-4.md)
- [Task 5: Wire ThreadListController in extension.ts](./task-5.md)
- [Task 6: Extend PanelState with Agent Fields](./task-6.md)
- [Task 7: Update PanelStateManager for Agent Metadata](./task-7.md)
- [Task 8: Update SidecarPanelAdapter Header](./task-8.md)
- [Task 9: Add All Agents Aggregated View](./task-9.md)
- [Task 10: Add Thread Cycling Keyboard Shortcut](./task-10.md)

## Validation

After implementation:
1. `npm run compile` - No build errors
2. `npm run lint` - No lint errors
3. Manual test: Activity Bar shows "Sidecar" view with Threads
4. Manual test: Start 2 Claude sessions in different terminals
5. Manual test: Verify both appear in thread list with status indicators
6. Manual test: Click thread item, verify terminal & Sidecar panel switch
7. Manual test: Verify Sidecar header shows agent name
8. Manual test: Select "All Agents" view, verify file list shows all files
9. Manual test: Cmd+Shift+A cycles through threads
10. Manual test: File count badge updates when files change

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| TreeView performance with many threads | UI lag | Limit to 10 threads (spec requirement) |
| Thread/terminal sync race condition | Wrong panel shown | Use terminalId as single source of truth |
| Status updates while switching | Flicker | Debounce status changes |
| Memory leak from orphan TreeItems | Growing memory | Cleanup on session flush |
| Code Squad integration not defined | Feature incomplete | Phase 1-2 work standalone with manual multi-terminal |

## Future Phases (Not in this plan)

### Phase 3: Agent Attribution (Future)
- Agent badges in file list
- Agent-specific diff headers
- Per-agent comment routing

### Phase 4: Code Squad Integration (Future)
- Coordinator process detection
- IPC/API protocol integration
- Auto-spawn agent sessions

## Critical Files for Implementation

1. **`src/adapters/inbound/controllers/AIDetectionController.ts`** - Core session management, pattern to follow for ThreadListController, sessions Map to observe

2. **`src/application/ports/outbound/SessionContext.ts`** - Must extend with AgentMetadata, defines per-terminal session structure

3. **`src/domain/entities/AISession.ts`** - Entity to extend with AgentSession, defines current session model

4. **`src/extension.ts`** - Entry point where ThreadListController will be wired, shows DI pattern

5. **`src/application/ports/outbound/PanelState.ts`** - Must add agent fields, defines complete UI state interface
