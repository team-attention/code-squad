# Task 2: Create IThreadStateRepository Port

## Scope

Define the outbound port interface for thread state persistence.

## Deliverables

1. `src/application/ports/outbound/IThreadStateRepository.ts` - Repository interface

## Technical Design

```typescript
// src/application/ports/outbound/IThreadStateRepository.ts
import { ThreadState } from '../../../domain/entities/ThreadState';

export interface IThreadStateRepository {
  save(state: ThreadState): Promise<void>;
  findAll(): Promise<ThreadState[]>;
  findById(threadId: string): Promise<ThreadState | null>;
  findByTerminalId(terminalId: string): Promise<ThreadState | null>;
  delete(threadId: string): Promise<boolean>;
  updateWhitelist(threadId: string, patterns: string[]): Promise<void>;
}
```

## Test Scenarios

This is an interface definition - no direct tests. Implementation tests in Task 3.

## Files to Modify

| File | Action |
|------|--------|
| `src/application/ports/outbound/IThreadStateRepository.ts` | CREATE |

## Dependencies

- Task 1: ThreadState entity must exist

## Notes

- Interface only, implementation in Task 3
- findByTerminalId enables lookup when terminal events occur
- updateWhitelist is separate for efficient partial updates
