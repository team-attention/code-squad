# Thread Status Display

> Display terminal and AI agent status in the thread list UI for at-a-glance thread state visibility.

## Problem Statement

When managing multiple threads in Sidecar, users cannot see what's happening in each thread without switching to it:
- Is the terminal idle or running a command?
- Is the AI agent working, waiting for input, or has it finished?
- Which threads need attention?

Users must switch between threads just to check their status, breaking workflow and losing context.

## Goals

- Show AI agent status in thread list (4 states)
- Provide at-a-glance visibility without switching threads
- Help users know which thread needs their attention (asking state)

## Non-Goals

- Prompt users for status input
- Store user-provided context or notes
- Inject status into AI terminal
- Complex status history or analytics

## Use Cases

### UC1: DetectThreadStatus
- **Actor**: System
- **Trigger**: Terminal/AI activity changes
- **Preconditions**: Thread has an associated terminal
- **Flow**:
  1. System monitors terminal for AI agent activity
  2. System detects status changes based on terminal output patterns
  3. System updates thread status
  4. Thread list UI reflects new status
- **Business Rules**:
  - Four statuses:
    - `no_agent`: Terminal started, no AI agent running
    - `idle`: AI agent exists but idle, waiting for user input to proceed
    - `working`: AI agent is actively doing something
    - `asking`: AI agent is waiting for user permission/answer
  - Status updates in real-time with debounce
  - Default status for new terminal: `no_agent`
- **Location**: `application/useCases/DetectThreadStatusUseCase.ts`

### UC2: DisplayThreadStatus
- **Actor**: Thread list webview
- **Trigger**: Status update received
- **Preconditions**: Thread list is visible
- **Flow**:
  1. Thread list receives status update from extension
  2. Thread list updates the status indicator for that thread
  3. User sees current status without switching threads
- **Business Rules**:
  - Status shown as single icon/badge next to thread name
  - Each status has distinct visual indicator
- **Location**: Webview UI (thread-list)

## User Experience

### Thread List Display

```
┌─────────────────────────────────┐
│ Threads                      +  │
├─────────────────────────────────┤
│ ● fix-login-bug     🔄         │  ← AI working
│   add-dark-mode     ❓         │  ← AI asking (needs my answer)
│   refactor-api      ─          │  ← AI idle (needs my input)
│   new-feature       ○          │  ← no AI agent
└─────────────────────────────────┘
```

### Status Indicators

| Status | Icon | Description |
|--------|------|-------------|
| no_agent | ○ (empty circle) | Terminal started, no AI agent |
| idle | ─ (dash) | AI exists but idle, needs user input to proceed |
| working | 🔄 (spinner) | AI is actively working |
| asking | ❓ (question) | AI waiting for permission/answer |

## Technical Notes

### Architecture

```
Terminal Output
      │
      ▼
TerminalActivityTracker (existing)
      │
      ├── Parse output patterns
      ▼
DetectThreadStatusUseCase
      │
      ▼
ThreadListAdapter
      │
      ▼
Webview (display)
```

### Data Model

```typescript
export type ThreadStatus = 'no_agent' | 'idle' | 'working' | 'asking';

export interface ThreadStatusData {
  threadId: string;
  status: ThreadStatus;
  lastUpdated: number;
}
```

### Detection Strategy

Monitor terminal output and detect patterns:

| Status | Detection Pattern |
|--------|-------------------|
| no_agent | No AI command detected (no `claude`, `codex`, etc.) |
| idle | AI prompt shown, waiting for user to type command |
| working | AI outputting text (streaming response) |
| asking | AI asking permission question (Y/n prompt, tool approval) |

**Pattern Examples (Claude)**:
- `idle`: `>` prompt at end of output
- `working`: Text streaming, no prompt
- `asking`: `Allow?`, `(Y/n)`, permission prompts

Debounce updates (100-200ms) to avoid flicker.

### Integration Points

- **TerminalActivityTracker**: Extend to detect AI status patterns
- **ThreadListController**: Subscribe to status updates
- **ThreadListAdapter**: Send status to webview
- **Webview**: Render status indicator

### Message Protocol (Extension ↔ Webview)

```typescript
// Extension → Webview
interface ThreadStatusUpdateMessage {
  type: 'threadStatusUpdate';
  threadId: string;
  status: ThreadStatus;
}
```

## Open Questions

1. **Detection Accuracy**:
   - How to distinguish `idle` vs `asking`? Both wait for user input.
   - Different AI tools have different prompt patterns.

2. **Edge Cases**:
   - What if AI crashes mid-response?
   - What if terminal output is too fast to parse?

## Dependencies

### Internal
- **TerminalActivityTracker**: Existing terminal monitoring
- **ThreadListAdapter**: Thread list webview communication
- **ThreadState**: Thread metadata

### New Files
- `src/application/useCases/DetectThreadStatusUseCase.ts`
- Update `src/adapters/inbound/ui/ThreadListAdapter.ts`
- Update webview thread-list component
