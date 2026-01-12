# Task 1: Create ThreadState Domain Entity

## Scope

Create the `ThreadState` domain entity that represents a thread's metadata and state.

## Deliverables

1. `src/domain/entities/ThreadState.ts` - ThreadState entity class
2. Update `src/application/ports/outbound/SessionContext.ts` - Add threadState field

## Technical Design

```typescript
// src/domain/entities/ThreadState.ts
export interface ThreadStateData {
  threadId: string;
  name: string;
  terminalId: string;
  workingDir: string;
  branch?: string;
  worktreePath?: string;
  whitelistPatterns: string[];
  createdAt: number;
}

export class ThreadState {
  readonly threadId: string;
  readonly name: string;
  readonly terminalId: string;
  readonly workingDir: string;
  readonly branch?: string;
  readonly worktreePath?: string;
  private _whitelistPatterns: string[];
  readonly createdAt: number;

  private constructor(data: ThreadStateData) { ... }

  static create(data: Omit<ThreadStateData, 'threadId' | 'createdAt'>): ThreadState;
  static fromData(data: ThreadStateData): ThreadState;

  get whitelistPatterns(): string[] { return [...this._whitelistPatterns]; }

  addWhitelistPattern(pattern: string): void;
  removeWhitelistPattern(pattern: string): void;
  hasWhitelistPattern(pattern: string): boolean;

  toData(): ThreadStateData;
}
```

## Test Scenarios

### TS1.1: Create ThreadState

**Given**: Valid thread creation parameters
**When**: ThreadState.create() is called
**Then**:
- ThreadState instance is created with generated UUID
- createdAt is set to current timestamp
- whitelistPatterns is initialized as empty array

### TS1.2: Create from Data

**Given**: Complete ThreadStateData from storage
**When**: ThreadState.fromData() is called
**Then**: ThreadState is reconstructed with exact values

### TS1.3: Manage Whitelist Patterns

**Given**: ThreadState instance
**When**: addWhitelistPattern("dist/**") is called
**Then**: Pattern is added to whitelistPatterns

**Given**: ThreadState with pattern "dist/**"
**When**: removeWhitelistPattern("dist/**") is called
**Then**: Pattern is removed from whitelistPatterns

### TS1.4: Serialize to Data

**Given**: ThreadState instance
**When**: toData() is called
**Then**: Returns ThreadStateData matching all properties

## Files to Modify

| File | Action |
|------|--------|
| `src/domain/entities/ThreadState.ts` | CREATE |
| `src/application/ports/outbound/SessionContext.ts` | MODIFY - add threadState |

## Dependencies

None - this is a foundational task.

## Notes

- No vscode imports allowed in domain layer
- UUID generation uses simple implementation (no external deps)
- whitelistPatterns is mutable for easier management
