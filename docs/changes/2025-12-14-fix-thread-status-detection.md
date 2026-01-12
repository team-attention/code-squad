# Fix: Thread Status Detection Always Shows Idle

## Problem

Thread status in the thread list UI always showed `─` (idle) even when Claude was actively working. The status icons were implemented but the detection was not functioning correctly.

## Research

Examined the thread status detection implementation:
- `src/domain/services/TerminalStatusDetector.ts` - Pattern matching logic
- `src/application/useCases/DetectThreadStatusUseCase.ts` - Status detection orchestration
- `src/adapters/inbound/controllers/AIDetectionController.ts` - Session management
- `src/extension.ts` - Wiring between components

## Root Cause

Two issues were identified:

1. **Initial status was 'inactive'**: When an AI session was created, no initial `agentMetadata` was set. This caused `agentStatus` to return 'inactive' by default, even though we had already detected an AI command running.

2. **Status reverted to 'inactive' on no pattern match**: The `DetectThreadStatusUseCase` would update status to 'inactive' when the `TerminalStatusDetector` couldn't match any pattern. This was incorrect because once an AI session is active, it should remain at least 'working' or 'idle', not revert to 'inactive'.

3. **Shell Integration API limitations**: The `TerminalShellExecution.read()` API may not reliably stream output from interactive TUI applications like Claude Code. Output depends on "rich" shell integration being enabled.

## Solution

1. **Set initial status to 'working'** when a session is created in `AIDetectionController.activateSidecar()`:
   ```typescript
   const session = AISession.create(type, terminalId);
   session.setAgentMetadata({
       name: threadState?.name ?? session.displayName,
       status: 'working',
       fileCount: 0,
   });
   ```

2. **Don't revert to 'inactive' in DetectThreadStatusUseCase**: Only update status when a meaningful pattern is detected:
   ```typescript
   if (detectedStatus !== 'inactive' && detectedStatus !== state.status) {
       state.status = detectedStatus;
       // ...
   }
   ```

3. **Initialize state as 'working'**: When first output is processed, start with 'working' status instead of 'inactive'.

## Files Changed

- `src/adapters/inbound/controllers/AIDetectionController.ts` - Set initial status to 'working' when session starts
- `src/application/useCases/DetectThreadStatusUseCase.ts` - Don't revert to 'inactive' on no pattern match

## Test Files Added

- `src/test/domain/services/TerminalStatusDetector.test.ts` - 26 tests for pattern detection
- `src/test/application/useCases/DetectThreadStatusUseCase.test.ts` - 10 tests for status orchestration

## Validation

- ✅ Compile: `npm run compile` passes
- ✅ Lint: `npm run lint` passes (only pre-existing warnings)
- ✅ Tests: 306 passing, 23 failing (same 23 pre-existing failures in InMemorySnapshotRepository)

## Review

### Self-Evaluation

- ✅ Problem solved: Initial status is now 'working' when AI is detected
- ✅ No regression: Same number of test failures as before
- ✅ Architecture compliance: Changes follow hexagonal architecture
- ✅ Tests added: 36 new passing tests

### User Feedback

(Pending user verification)

### KB Updates Needed

- [ ] None required - this was a bug fix, not a behavioral change

### Follow-up Fix: Codex/Gemini Pattern Detection

**Problem**: After the initial fix, user reported that only Claude status detection worked. Codex and Gemini showed stuck at `working` (⟳) status even when idle.

**Root Cause**: The `GENERIC_PATTERNS` used for Codex/Gemini only matched:
- `^>\s*$` (empty prompt)
- `\$\s*$` (shell prompt)

But the actual output from these tools is different:
- **Gemini**: Shows `> Type your message or @path/to/file`
- **Codex**: Shows `⮐ send  ^J newline  ^T transcript  ^C quit`

**Solution**: Created dedicated `CODEX_PATTERNS` and `GEMINI_PATTERNS` with tool-specific idle detection patterns.

**Files Changed**:
- `src/domain/services/TerminalStatusDetector.ts` - Added Codex and Gemini specific patterns
- `src/test/domain/services/TerminalStatusDetector.test.ts` - Added 13 new tests for Codex/Gemini patterns

**Validation**:
- ✅ Compile: `npm run compile` passes
- ✅ Lint: `npm run lint` passes (only pre-existing warnings)
- ✅ Tests: 319 passing (13 new), 23 failing (same pre-existing failures)

### Follow-up Fix #2: Status Transitions and Gemini Waiting Detection

**Problems Reported**:
1. Terminal open but AI not running shows working (⟳) instead of idle (─)
2. Claude/Gemini don't detect working status during operations like `sleep 10s`
3. Gemini "Waiting for user confirmation..." shows `-` instead of `?`
4. Codex keeps spinning after completion

**Root Cause Analysis**:
1. **Initial state issue**: `DetectThreadStatusUseCase.getOrCreateState()` set initial status to 'working' regardless of actual state
2. **Activity-based fallback limitation**: The fallback in `extension.ts` only triggered when `currentStatus === 'inactive'`, so couldn't transition from 'working' to 'idle' when shell execution ended
3. **Missing Gemini patterns**: "Waiting for user confirmation" wasn't matched by existing patterns
4. **Codex completion**: When `onDidEndTerminalShellExecution` fired, the activity-based callback wouldn't update status because pattern-based status was 'working'

**Solution**:
1. **Changed initial state to 'inactive'** in `DetectThreadStatusUseCase` - actual status determined by pattern detection
2. **Updated activity-based detection** in `extension.ts` to transition from 'working' to 'idle' when shell execution ends
3. **Added Gemini waiting patterns**: `Waiting for user/i`, `Allow execution/i`, `Enter to select/i`, `Press Enter/i`
4. **Updated test** to expect 'inactive' for unmatched patterns instead of 'working'

**Files Changed**:
- `src/application/useCases/DetectThreadStatusUseCase.ts` - Initial state changed to 'inactive'
- `src/extension.ts` - Activity-based detection now transitions working→idle on shell end
- `src/domain/services/TerminalStatusDetector.ts` - Added Gemini waiting patterns
- `src/test/application/useCases/DetectThreadStatusUseCase.test.ts` - Updated test expectations

**Validation**:
- ✅ Compile: `npm run compile` passes
- ✅ Lint: `npm run lint` passes (only pre-existing warnings)

## Next Actions

1. **Test in real environment**: Verify all four reported issues are resolved
2. **Consider Pseudoterminal approach**: For more reliable output detection, the spec at `docs/specs/sidecar-2025-12-14-terminal-status-detection.md` proposes using VSCode's Pseudoterminal API to wrap the terminal and capture output directly
