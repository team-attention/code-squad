# Feature: Code Squad Multi-Agent View

## Summary

Provide a unified monitoring and interaction interface for multiple AI agents (from Code Squad) running simultaneously in the same VSCode workspace. Users can switch between different agent sessions, view their individual file changes, and provide session-specific feedback while maintaining clear visibility of which agent modified which files.

## Background

Code Squad is a multi-agent orchestration system where multiple Claude agents work in parallel on different aspects of a codebase. Currently, Sidecar is designed for single-session workflows - when one AI tool (Claude Code, Codex, or Gemini) is running in a terminal.

With Code Squad, multiple agents may be active simultaneously, each making changes to different files or even the same files. Users need a way to:
- Monitor all active agents in one place
- See which agent is responsible for which changes
- Provide feedback to specific agents
- Understand the overall state of the multi-agent coding session

This feature extends Sidecar's existing per-terminal session architecture to support orchestrated multi-agent scenarios where a central Code Squad coordinator manages multiple agent instances.

## Terms

| Term | Definition |
|------|------------|
| Code Squad | Multi-agent orchestration system that manages multiple AI agents working in parallel |
| Agent Session | Individual AI agent instance running as part of Code Squad (e.g., "Backend Agent", "Frontend Agent") |
| Coordinator | Code Squad's central process that orchestrates multiple agent sessions |
| Agent Metadata | Information about an agent (name, role, status, file assignments) |
| Multi-Agent Panel | Enhanced Sidecar panel that displays multiple agent sessions simultaneously |
| Session Selector | UI component for switching between different agent session views |
| Agent Activity | Real-time status of agent operations (idle, working, waiting for feedback) |

## Use Cases

### UC1: DisplayMultiAgentSessions
- **Actor**: Developer using Code Squad
- **Trigger**: Code Squad coordinator starts and spawns multiple agent sessions
- **Flow**:
  1. Sidecar detects Code Squad coordinator process
  2. System retrieves list of active agent sessions from coordinator
  3. Panel displays session selector with agent names/roles
  4. Each agent's file changes appear in sidebar grouped by agent
  5. Visual indicators show which agent is currently active/working
- **Business Rules**:
  - Each agent session must have unique identifier
  - Agent metadata includes: name, role, status, assigned files
  - Default view shows all agents' changes consolidated
  - Individual agent view shows only that agent's changes
- **Location**: `application/useCases/DisplayMultiAgentSessionsUseCase.ts`

### UC2: SwitchAgentSession
- **Actor**: Developer reviewing changes
- **Trigger**: User clicks on different agent in session selector
- **Flow**:
  1. User selects agent from session selector dropdown
  2. System filters file list to show only selected agent's changes
  3. Diff viewer displays changes from selected agent
  4. Comment context updates to target selected agent
  5. Panel header updates with agent name/role
- **Business Rules**:
  - Switching sessions preserves scroll position per agent
  - Comments are scoped to specific agent session
  - Draft comments persist when switching between agents
  - Uncommitted files toggle state is per-agent
- **Location**: `application/useCases/SwitchAgentSessionUseCase.ts`

### UC3: SubmitAgentFeedback
- **Actor**: Developer providing feedback
- **Trigger**: User submits comments for specific agent
- **Flow**:
  1. User adds comments on lines modified by agent
  2. User clicks "Submit Comments" button
  3. System routes comments to specific agent's terminal/process
  4. Agent receives formatted feedback in its context
  5. System marks comments as submitted for that agent
- **Business Rules**:
  - Comments only submitted to the agent that owns the file change
  - Cannot submit cross-agent comments
  - Feedback format includes file path, line numbers, and context
  - Submitted comments cannot be edited
- **Location**: `application/useCases/SubmitAgentFeedbackUseCase.ts`

### UC4: MonitorAgentActivity
- **Actor**: Developer monitoring progress
- **Trigger**: Agent status changes (idle → working → waiting)
- **Flow**:
  1. Code Squad coordinator broadcasts agent status updates
  2. System receives status change events
  3. Panel updates agent indicator in session selector
  4. Activity badge shows current operation count per agent
  5. Optional notification for completed/blocked agents
- **Business Rules**:
  - Status updates in real-time (polling interval max 2 seconds)
  - Activity indicators use color coding (green=active, yellow=waiting, gray=idle)
  - Badge shows number of pending file changes per agent
  - Coordinator connection loss shows warning state
- **Location**: `application/useCases/MonitorAgentActivityUseCase.ts`

### UC5: ViewAggregatedChanges
- **Actor**: Developer reviewing overall progress
- **Trigger**: User selects "All Agents" view in session selector
- **Flow**:
  1. User switches to aggregated view mode
  2. System merges file lists from all active agents
  3. File list shows agent attribution badges
  4. Selecting file shows diff with agent indicator
  5. Comments can be added to any agent's changes
- **Business Rules**:
  - Files modified by multiple agents show all agent badges
  - Diff view indicates which agent made each change (via metadata)
  - Aggregated stats show total additions/deletions across all agents
  - Can filter by file status (added/modified/deleted) across all agents
- **Location**: `application/useCases/ViewAggregatedChangesUseCase.ts`

### UC6: DetectCodeSquadSession
- **Actor**: Code Squad coordinator
- **Trigger**: Code Squad process starts in terminal
- **Flow**:
  1. Terminal execution monitor detects Code Squad command
  2. System prompts user to enable multi-agent monitoring
  3. Sidecar connects to Code Squad coordinator API/socket
  4. Coordinator provides initial agent session list
  5. Multi-agent panel activates with session selector
- **Business Rules**:
  - Detection pattern: `code-squad`, `codesquad`, or coordinator-specific command
  - Coordinator must expose agent metadata via API or IPC
  - Fallback to single-agent mode if coordinator unavailable
  - User can disable Code Squad detection in settings
- **Location**: `application/useCases/DetectCodeSquadSessionUseCase.ts`

## UI/UX

### Components

#### 1. Thread List Panel (New - 왼쪽 Activity Bar)
- VSCode TreeView in Activity Bar (별도 패널)
- Lists all active agent threads with status indicators
- "All Agents View" option for aggregated view
- Visual states:
  - Working agent: green dot (●) + agent name
  - Idle agent: gray dot (○) + agent name
  - Waiting agent: yellow dot + agent name
  - Error state: red dot + agent name
- Shows file count per agent
- Click to select agent → Terminal & Sidecar update
- "[+ New Thread]" button for spawning new agents

#### 2. Agent Terminal (중앙 - Editor Area)
- Standard VSCode terminal panel
- Displays selected agent's terminal output
- Each agent runs in its own terminal instance
- Terminal switches when agent selected in Thread List

#### 3. Sidecar Panel (오른쪽 - Side Panel)
- Existing Sidecar panel showing selected agent's changes
- Header shows current agent name
- File list shows only selected agent's modified files
- Diff viewer for selected agent's changes
- Comments scoped to current agent

#### 4. Enhanced Sidecar Header (Modified)
- Shows which agent is currently selected
- Agent name/role prominently displayed
- "Submit to [Agent Name]" button

#### 5. All Agents View (Optional Mode)
- When "All Agents View" selected in Thread List
- Sidecar shows aggregated file list from all agents
- Agent attribution badges next to file names
- Color-coded by agent (6-color palette)
- Multi-agent icon when file modified by >1 agent

### Interactions

1. **Thread Selection** (Thread List → Terminal + Sidecar):
   - Click agent in Thread List (왼쪽)
   - Terminal (중앙) switches to selected agent's terminal
   - Sidecar (오른쪽) updates to show selected agent's changes
   - Keyboard shortcut: Cmd/Ctrl+Shift+A to cycle through agents

2. **All Agents View**:
   - Click "All Agents View" in Thread List
   - Sidecar shows aggregated file list from all agents
   - Agent badges indicate which agent modified each file
   - Terminal shows most recently active agent

3. **Comment Submission**:
   - Comments auto-scoped to currently selected agent
   - Submit button shows target agent: "Submit to Backend Agent"
   - Comments sent to selected agent's terminal

4. **Status Monitoring**:
   - Real-time status updates in Thread List
   - Visual indicators (● working, ○ idle, ⚠ waiting)
   - Toast notification when agent needs input
   - Click notification → Switch to that agent's view

### Mockups

#### Overall Layout (3-Column)

```
┌──────────────┬──────────────────────────┬─────────────────────────────────────────────┐
│ Thread List  │    Agent Terminal        │              Sidecar Panel                  │
│ (왼쪽)       │    (중앙)                │              (오른쪽)                       │
├──────────────┼──────────────────────────┼─────────────────────────┬───────────────────┤
│              │                          │ [Backend] User.ts +5 -2 │ Sidecar           │
│ Code Squad   │ $ claude                 ├─────────────────────────┤ ● Backend Agent   │
│ ───────────  │ > Working on             │                         ├───────────────────┤
│              │   UserService...         │  @@ -15,7 +15,12 @@    │ Files (3)         │
│ ● Backend    │ > Reading                │  - async findUser()     │ ┌───────────────┐ │
│   └ 3 files  │   AuthController...      │  + async findUser():    │ │ User.ts     M │ │
│              │ > ...                    │  + if (!id) return      │ └───────────────┘ │
│ ○ Frontend   │                          │                         │                   │
│   └ 2 files  │                          │   Diff View             │ Comments          │
│              │                          │   (header는 여기만)     │ (no comments)     │
│ ● Database   │                          │                         │                   │
│   └ 1 file   │                          │                         │ [Ask Backend]     │
│ ───────────  │                          │                         │                   │
│ [+ Thread]   │                          │                         │                   │
└──────────────┴──────────────────────────┴─────────────────────────┴───────────────────┘
    왼쪽              중앙                     main-content             sidebar
 Thread 관리    선택된 Agent 터미널         (diff-header+viewer)    (files+comments)
```

#### Thread List Panel (왼쪽)

```
┌──────────────────────┐
│ Code Squad           │
│ ══════════════════   │
│                      │
│ ● Backend Agent      │  ← 현재 선택 (하이라이트)
│   └ 3 files changed  │
│   └ Status: Working  │
│                      │
│ ○ Frontend Agent     │  ← 대기 중
│   └ 2 files changed  │
│   └ Status: Idle     │
│                      │
│ ● Database Agent     │  ← 작업 중
│   └ 1 file changed   │
│   └ Status: Working  │
│                      │
│ ────────────────     │
│ [+ New Thread]       │  ← 새 에이전트 추가
│ [All Agents View]    │  ← 통합 뷰 전환
└──────────────────────┘
```

#### Sidecar Panel (오른쪽 - 선택된 Agent 전용)

기존 Sidecar 레이아웃 유지: Diff 왼쪽, Sidebar 오른쪽

```
┌───────────────────────────────────────────────┬─────────────────────────┐
│ [Backend Agent] UserService.ts    +12 -5 [<] │ Sidecar                 │
├───────────────────────────────────────────────┤ ● Backend Agent         │
│                                               ├─────────────────────────┤
│  @@ -15,7 +15,12 @@                          │ Changed Files (3)       │
│                                               │ ┌─────────────────────┐ │
│    export class UserService {                 │ │ UserService.ts    M │ │
│  -   async findUser(id: string) {             │ │ AuthController.ts M │ │
│  +   async findUser(id: string): Promise {    │ │ User.model.ts     M │ │
│  +     if (!id) return null;                  │ └─────────────────────┘ │
│  +     ...                                    │                         │
│                                               │ Comments                │
│                                               │ ┌─────────────────────┐ │
│        Diff View                              │ │ (no comments yet)   │ │
│        (diff-header는 여기 위에만)            │ └─────────────────────┘ │
│                                               │                         │
│                                               │ [Ask Backend Agent]     │
└───────────────────────────────────────────────┴─────────────────────────┘
       main-content (diff-header + diff-viewer)        sidebar
```

**변경점**:
- diff-header에 Agent 이름 추가: `[Backend Agent] UserService.ts`
- sidebar header에 현재 Agent 상태 표시: `● Backend Agent`
- Ask 버튼에 Agent 이름: `[Ask Backend Agent]`

## Non-Functional Requirements

### Performance
- Agent status updates: < 100ms latency
- Support up to 10 concurrent agent sessions
- Session switching: < 200ms UI response time
- File list filtering: < 50ms for up to 500 files

### Reliability
- Graceful degradation if Code Squad coordinator disconnects
- Preserve session state if VSCode is reloaded
- Auto-reconnect to coordinator on connection loss
- Fallback to single-agent mode if multi-agent detection fails

### Scalability
- Memory usage scales linearly with agent count (max 10 agents)
- Each agent session maintains independent snapshot repository
- Shared file watch controller across all sessions
- Lazy-load agent metadata (only load when session selected)

### Compatibility
- Works with existing single-agent workflow (backward compatible)
- Code Squad coordinator must implement IPC/API protocol
- Supports terminal-based and headless Code Squad modes
- Cross-platform (Windows, macOS, Linux)

## Open Questions

1. **Code Squad Integration Protocol**:
   - How does Code Squad expose agent metadata? (IPC, socket, REST API, stdout parsing)
   - What format for agent status updates? (JSON, protobuf, custom)
   - Does coordinator provide file-to-agent mapping or does Sidecar infer it?

2. **File Conflict Resolution**:
   - When multiple agents modify same file, how to handle diff merging?
   - Should Sidecar detect conflicts and warn user?
   - Can agents override each other's changes?

3. **Comment Routing**:
   - How are comments delivered to specific agents? (via coordinator or direct)
   - What if target agent terminates before receiving comments?
   - Should there be a "broadcast comment to all agents" option?

4. **Session Lifecycle**:
   - Does multi-agent session end when coordinator exits or when all agents finish?
   - Can agents be added/removed dynamically during session?
   - How to handle agent crashes/restarts?

5. **UI Preferences**:
   - Should default view be "All Agents" or first active agent?
   - Save last selected agent per workspace?
   - Allow custom agent grouping/categorization?

## Dependencies

### External
- **Code Squad**: Coordinator must expose agent metadata and accept feedback
- **VSCode IPC**: For inter-process communication with Code Squad process
- **WebSocket/HTTP Client** (optional): If Code Squad uses network protocol

### Internal
- Extends existing `AIDetectionController` for Code Squad detection
- Reuses `SidecarPanelAdapter` with multi-session support
- New `CodeSquadCoordinatorPort` outbound port for coordinator communication
- Enhanced `PanelState` to include agent session metadata
- New `AgentSessionManager` service in application layer

### Configuration
```json
{
  "sidecar.codeSquad.enabled": true,
  "sidecar.codeSquad.coordinatorPort": 9090,
  "sidecar.codeSquad.autoDetect": true,
  "sidecar.codeSquad.maxAgents": 10,
  "sidecar.codeSquad.statusPollInterval": 2000
}
```

## Migration Path

### Phase 1: Detection & Basic Multi-Session Support
- Detect Code Squad coordinator process
- Display agent list in panel
- Basic session switching (filter files by agent)

### Phase 2: Enhanced Agent Attribution
- Show agent badges in file list
- Agent-specific diff headers
- Per-agent comment routing

### Phase 3: Advanced Monitoring
- Real-time agent status updates
- Activity panel with operation log
- Aggregated view with conflict detection

### Phase 4: Collaboration Features
- Cross-agent commenting
- Agent coordination hints
- Shared snapshot baseline for conflict resolution

## Notes

- This feature maintains backward compatibility with single-agent workflows
- Multi-agent detection is opt-in via settings
- Code Squad coordinator protocol needs to be defined (separate spec)
- Consider future: agent-to-agent communication visibility, task dependency graphs
- Each agent maintains its own session context (snapshots, comments, state)
- Reuses existing per-terminal architecture: each agent = separate terminal session
