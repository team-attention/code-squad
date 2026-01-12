# Task 4: Create DetectThreadStatusUseCase

## Goal

Create use case that orchestrates status detection with debouncing and state management.

## Files

- `src/application/useCases/DetectThreadStatusUseCase.ts` (new)
- `src/application/ports/inbound/IDetectThreadStatusUseCase.ts` (new)

## Implementation

### Port Interface

```typescript
// IDetectThreadStatusUseCase.ts
import { AgentStatus } from '../../domain/entities/AISession';

export interface StatusChangeCallback {
  (terminalId: string, status: AgentStatus): void;
}

export interface IDetectThreadStatusUseCase {
  /**
   * Process terminal output and detect status changes
   */
  processOutput(terminalId: string, aiType: AIType, output: string): void;

  /**
   * Get current status for a terminal
   */
  getStatus(terminalId: string): AgentStatus;

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: StatusChangeCallback): void;

  /**
   * Clear state for a terminal (on close)
   */
  clear(terminalId: string): void;
}
```

### Use Case Implementation

```typescript
// DetectThreadStatusUseCase.ts
import { ITerminalStatusDetector, AIType } from '../../domain/services/TerminalStatusDetector';
import { AgentStatus } from '../../domain/entities/AISession';
import { IDetectThreadStatusUseCase, StatusChangeCallback } from '../ports/inbound/IDetectThreadStatusUseCase';

interface TerminalState {
  status: AgentStatus;
  buffer: string[];
  lastUpdate: number;
  debounceTimer?: NodeJS.Timeout;
}

export class DetectThreadStatusUseCase implements IDetectThreadStatusUseCase {
  private states = new Map<string, TerminalState>();
  private callbacks: StatusChangeCallback[] = [];

  private static DEBOUNCE_MS = 200;
  private static BUFFER_LINES = 10;

  constructor(private detector: ITerminalStatusDetector) {}

  processOutput(terminalId: string, aiType: AIType, output: string): void {
    const state = this.getOrCreateState(terminalId);

    // Add new lines to buffer
    const newLines = output.split('\n');
    state.buffer.push(...newLines);
    state.buffer = state.buffer.slice(-DetectThreadStatusUseCase.BUFFER_LINES);

    // Debounce status detection
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }

    state.debounceTimer = setTimeout(() => {
      const newStatus = this.detector.detectFromBuffer(aiType, state.buffer);

      if (newStatus !== state.status) {
        state.status = newStatus;
        state.lastUpdate = Date.now();
        this.notifyChange(terminalId, newStatus);
      }
    }, DetectThreadStatusUseCase.DEBOUNCE_MS);
  }

  getStatus(terminalId: string): AgentStatus {
    return this.states.get(terminalId)?.status ?? 'inactive';
  }

  onStatusChange(callback: StatusChangeCallback): void {
    this.callbacks.push(callback);
  }

  clear(terminalId: string): void {
    const state = this.states.get(terminalId);
    if (state?.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }
    this.states.delete(terminalId);
  }

  private getOrCreateState(terminalId: string): TerminalState {
    if (!this.states.has(terminalId)) {
      this.states.set(terminalId, {
        status: 'inactive',
        buffer: [],
        lastUpdate: Date.now(),
      });
    }
    return this.states.get(terminalId)!;
  }

  private notifyChange(terminalId: string, status: AgentStatus): void {
    for (const callback of this.callbacks) {
      callback(terminalId, status);
    }
  }
}
```

## Test Scenarios

### TS-4.1: Initial status is inactive
- **Given**: New terminal ID
- **When**: `getStatus(terminalId)` called
- **Then**: Returns `'inactive'`

### TS-4.2: Status changes on output
- **Given**: Terminal with no prior status
- **When**: `processOutput` called with working pattern
- **Then**: `onStatusChange` callback fired with `'working'`

### TS-4.3: Debouncing prevents flicker
- **Given**: Terminal receiving rapid output
- **When**: Multiple `processOutput` calls within 200ms
- **Then**: Only single `onStatusChange` callback fired

### TS-4.4: Buffer maintained
- **Given**: Terminal receiving output over time
- **When**: More than 10 lines received
- **Then**: Only last 10 lines kept in buffer

### TS-4.5: Clear removes state
- **Given**: Terminal with status state
- **When**: `clear(terminalId)` called
- **Then**: State removed, `getStatus` returns `'inactive'`

## Notes

- No VSCode imports (application layer)
- Stateful (manages per-terminal state)
- Debouncing is 200ms per spec
- Buffer keeps last 10 lines for context-aware detection
