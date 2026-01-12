# Thread Status Display - Implementation Plan

> Display AI agent status (`no_agent`, `idle`, `working`, `asking`) in thread list UI.

## Overview

This feature enables real-time visibility of AI agent status across threads without switching context. Users can see at-a-glance which threads need attention.

**Spec**: `docs/specs/sidecar-2025-12-14-thread-status-asking.md`
**Related Spec**: `docs/specs/sidecar-2025-12-14-terminal-status-detection.md`

## Technical Design

### Status Type Decision

**Current**: `AgentStatus = 'working' | 'idle' | 'waiting' | 'error'`
**Spec**: `ThreadStatus = 'no_agent' | 'idle' | 'working' | 'asking'`

**Decision**: Keep existing `AgentStatus` type but map semantics:
- `'idle'` → Agent idle, waiting for user input to proceed
- `'working'` → Agent actively processing
- `'waiting'` → Agent asking for permission/answer (maps to spec's `asking`)
- Add `'inactive'` for `no_agent` state (no AI detected)

Update the type to:
```typescript
export type AgentStatus = 'inactive' | 'idle' | 'working' | 'waiting';
```

### Architecture

```
Terminal Output (via Shell Execution API)
      │
      ▼
VscodeTerminalGateway ─── execution.read() stream
      │
      ▼
TerminalStatusDetector (new domain service)
      │
      ├── Pattern matching per AI type
      ├── Debounce (200ms)
      ▼
DetectThreadStatusUseCase (new)
      │
      ▼
extension.ts (wire status updates)
      │
      ▼
ThreadListController.refresh()
      │
      ▼
ThreadListWebviewProvider (send status)
      │
      ▼
Webview (render icons)
```

### Key Components

| Component | Location | Role |
|-----------|----------|------|
| **VscodeTerminalGateway** | `adapters/outbound/gateways/VscodeTerminalGateway.ts` | Read terminal output via `execution.read()` |
| **TerminalStatusDetector** | `domain/services/TerminalStatusDetector.ts` | Pattern matching logic |
| **DetectThreadStatusUseCase** | `application/useCases/DetectThreadStatusUseCase.ts` | Orchestrates detection |
| **ThreadListWebviewProvider** | `adapters/inbound/ui/ThreadListWebviewProvider.ts` | Updates UI with status |

### Limitation

Shell Integration required for output reading. For terminals without shell integration, falls back to activity-based detection (working/idle only).

### Message Protocol

Existing `updateThreads` message already includes `status`. Update `ThreadInfo` to use new status values and update webview rendering.

## Tasks

| # | Task | Files |
|---|------|-------|
| 1 | [Update AgentStatus type](./task-1.md) | `domain/entities/AISession.ts` |
| 2 | [Create TerminalStatusDetector](./task-2.md) | `domain/services/TerminalStatusDetector.ts` |
| 3 | [Add Terminal Output Stream](./task-3.md) | `VscodeTerminalGateway.ts`, `ITerminalPort.ts` |
| 4 | [Create DetectThreadStatusUseCase](./task-4.md) | `application/useCases/DetectThreadStatusUseCase.ts` |
| 5 | [Integrate status detection](./task-5.md) | `extension.ts` |
| 6 | [Update webview UI](./task-6.md) | `ThreadListWebviewProvider.ts` |

## Test Scenarios

### TS-1: New thread shows inactive status
- **Given**: User creates new thread via "New Thread" button
- **When**: Terminal opens but no AI command run yet
- **Then**: Thread shows `inactive` status (empty circle icon)

### TS-2: Claude Code working detection
- **Given**: Claude Code showing spinner `● Reading src/index.ts`
- **When**: Terminal output detected
- **Then**: Thread shows `working` status (spinner icon)

### TS-3: Claude Code waiting/asking detection
- **Given**: Claude Code showing `(y/n)` or `Enter to select`
- **When**: Terminal output detected
- **Then**: Thread shows `waiting` status (question icon)

### TS-4: Claude Code idle detection
- **Given**: Claude Code showing `> ` prompt
- **When**: Terminal output detected
- **Then**: Thread shows `idle` status (dash icon)

### TS-5: Status debouncing
- **Given**: Rapid terminal output changes
- **When**: Multiple patterns match within 200ms
- **Then**: Only final status applied, no flicker

### TS-6: Attached terminal shows inactive
- **Given**: User attaches to existing terminal via command
- **When**: Thread list updates
- **Then**: Thread shows `inactive` status (no detection available)

## Dependencies

- VSCode Shell Execution API (`TerminalShellExecution.read()`) - requires VSCode 1.88+
- Existing `ThreadListWebviewProvider`
- Existing `VscodeTerminalGateway`

## Risks

1. **Pattern accuracy**: AI CLI output may change between versions
   - Mitigation: Configurable patterns, conservative matching

2. **Performance**: High-frequency terminal output
   - Mitigation: Debouncing, buffer limits

3. **Shell Integration**: Some terminals may not have shell integration enabled
   - Mitigation: Fallback to activity-based detection (working/idle)
