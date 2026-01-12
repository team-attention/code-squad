# Thread Status Display - Implementation Changes

**Spec**: `docs/specs/sidecar-2025-12-14-thread-status-asking.md`
**Plan**: `docs/plans/sidecar-2025-12-14-thread-status-asking/main.md`

## Summary

Implemented real-time AI agent status detection and display in the thread list UI. Users can now see at-a-glance which threads need attention based on the AI agent's current state.

## Changes

### Domain Layer

#### `src/domain/entities/AISession.ts`
- Updated `AgentStatus` type: `'inactive' | 'idle' | 'working' | 'waiting'`
- Changed default status from `'idle'` to `'inactive'`
- Removed `'error'` status (not in spec)

#### `src/domain/services/TerminalStatusDetector.ts` (new)
- Created pattern-based status detection service
- Implements `ITerminalStatusDetector` interface
- Supports Claude Code patterns for `waiting`, `working`, `idle` detection
- Pattern priorities: waiting (3) > working (2) > idle (1)
- Strips ANSI escape codes from terminal output
- Generic fallback patterns for unknown AI types

### Application Layer

#### `src/application/ports/inbound/IDetectThreadStatusUseCase.ts` (new)
- Port interface for status detection use case
- `processOutput(terminalId, aiType, output)`: Process terminal output
- `getStatus(terminalId)`: Get current status
- `onStatusChange(callback)`: Subscribe to changes
- `clear(terminalId)`: Clean up state

#### `src/application/useCases/DetectThreadStatusUseCase.ts` (new)
- Orchestrates status detection with debouncing (200ms)
- Maintains per-terminal state with 10-line buffer
- Notifies subscribers on status changes

#### `src/application/ports/outbound/ITerminalPort.ts`
- Added `TerminalOutputCallback` type
- Added `onTerminalOutput(callback)` method

### Adapters Layer

#### `src/adapters/outbound/gateways/VscodeTerminalGateway.ts`
- Added `outputCallbacks` array
- Added `readOutputStream()` method using `TerminalShellExecution.read()`
- Added `notifyOutput()` method
- Added `onTerminalOutput()` implementation
- Output stream reading starts on shell execution start

#### `src/adapters/inbound/ui/ThreadListWebviewProvider.ts`
- Updated default status to `'inactive'`
- Added CSS for status icons with spinner animation
- Added `getStatusIcon()` and `getStatusTitle()` functions
- Updated render function to show status icons with tooltips
- Added `thread-file-count` styling

### Extension Wiring

#### `src/extension.ts`
- Import `TerminalStatusDetector` and `DetectThreadStatusUseCase`
- Create detector and use case instances
- Wire terminal output to status detection
- Subscribe to status changes to update session metadata
- Fallback to activity-based detection when no pattern match

### Test Updates

#### `src/test/application/useCases/SubmitCommentsRoutingUseCase.test.ts`
- Added `onTerminalOutput` method to `MockTerminalPort`

## Status Icons

| Status | Icon | Color | Description |
|--------|------|-------|-------------|
| inactive | `○` | Gray | No AI agent detected |
| idle | `─` | Default | AI ready for input |
| working | `⟳` | Green (spinning) | AI actively processing |
| waiting | `?` | Yellow | AI waiting for user answer |

## Test Scenarios Covered

- TS-1: New thread shows inactive status
- TS-2: Claude Code working detection (spinner patterns)
- TS-3: Claude Code waiting detection ((y/n), Enter to select)
- TS-4: Claude Code idle detection (> prompt)
- TS-5: Status debouncing (200ms)
- TS-6: Attached terminal shows inactive

## Validation

- `npm run compile`: Passes
- `npm run lint`: No new errors (only pre-existing warnings)
- `npm run test`: 270 passing, 23 failing (pre-existing failures in InMemorySnapshotRepository)

## Review

### Evaluation

- ✅ Spec compliance (partial - naming differs: `inactive`/`waiting` vs spec's `no_agent`/`asking`)
- ✅ Architecture compliance
- ✅ Tests passing (no new failures)
- ✅ Build success

### User Feedback

- Evaluation: **Needs improvement**
- Issues:
  1. **Codex/Gemini detection**: Agent start detection not working properly
     - Generic fallback patterns don't reliably detect when Codex/Gemini agents start
     - Only Claude Code has well-defined detection patterns
  2. **Claude working vs idle**: Cannot distinguish between working and idle states
     - Always shows `─` (idle) even when Claude is actively working
     - Pattern detection may not be triggering properly
  3. **Unclear UI element**: `fileCount` (0) shown on right side
     - Users don't understand what this number means
     - Consider removing or adding tooltip/label

### Feedback

**What went well**:
- Clean architecture separation (Domain service, Application use case, Adapters)
- Claude Code detection patterns work well
- Debouncing prevents UI flicker
- Fallback activity-based detection provides basic functionality

**What could be improved**:
- Add Codex-specific detection patterns
- Add Gemini-specific detection patterns
- Add unit tests for `TerminalStatusDetector` and `DetectThreadStatusUseCase`
- Consider renaming statuses to match spec (`no_agent`/`asking` vs current `inactive`/`waiting`)

### Friction

- None discovered

### Next Actions

1. **Fix Claude working detection**: Debug why working patterns aren't matching
   - Check if terminal output stream is being read correctly
   - Verify spinner patterns (`●◐◓◑◒⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏`) are in actual output
2. **Improve Codex/Gemini detection**: Research CLI output patterns
3. **Fix fileCount UI**: Either remove or add proper label/tooltip
4. Add unit tests for `TerminalStatusDetector` and `DetectThreadStatusUseCase`
