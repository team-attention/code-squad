# Task 3: Implement JsonThreadStateRepository

## Scope

Implement the thread state repository using JSON file storage.

## Deliverables

1. `src/infrastructure/repositories/JsonThreadStateRepository.ts` - Repository implementation
2. Wire in `src/extension.ts`

## Technical Design

```typescript
// src/infrastructure/repositories/JsonThreadStateRepository.ts
import * as fs from 'fs';
import * as path from 'path';
import { ThreadState, ThreadStateData } from '../../domain/entities/ThreadState';
import { IThreadStateRepository } from '../../application/ports/outbound/IThreadStateRepository';

interface ThreadsFile {
  threads: ThreadStateData[];
}

export class JsonThreadStateRepository implements IThreadStateRepository {
  private readonly filePath: string;

  constructor(workspaceRoot: string) {
    this.filePath = path.join(workspaceRoot, '.vscode', 'sidecar-threads.json');
  }

  async save(state: ThreadState): Promise<void> { ... }
  async findAll(): Promise<ThreadState[]> { ... }
  async findById(threadId: string): Promise<ThreadState | null> { ... }
  async findByTerminalId(terminalId: string): Promise<ThreadState | null> { ... }
  async delete(threadId: string): Promise<boolean> { ... }
  async updateWhitelist(threadId: string, patterns: string[]): Promise<void> { ... }

  private async readFile(): Promise<ThreadsFile> { ... }
  private async writeFile(data: ThreadsFile): Promise<void> { ... }
}
```

## Test Scenarios

### TS3.1: Save Thread State

**Given**: Empty repository
**When**: save(threadState) is called
**Then**:
- `.vscode/sidecar-threads.json` is created
- Thread data is persisted

### TS3.2: Find All Threads

**Given**: Repository with 3 threads
**When**: findAll() is called
**Then**: Returns array of 3 ThreadState instances

### TS3.3: Find By ID

**Given**: Repository with thread "thread-1"
**When**: findById("thread-1") is called
**Then**: Returns matching ThreadState

**Given**: Repository without thread "thread-x"
**When**: findById("thread-x") is called
**Then**: Returns null

### TS3.4: Find By Terminal ID

**Given**: Repository with thread linked to "terminal-1"
**When**: findByTerminalId("terminal-1") is called
**Then**: Returns matching ThreadState

### TS3.5: Delete Thread

**Given**: Repository with thread "thread-1"
**When**: delete("thread-1") is called
**Then**:
- Thread is removed from storage
- Returns true

**Given**: Repository without thread "thread-x"
**When**: delete("thread-x") is called
**Then**: Returns false

### TS3.6: Update Whitelist

**Given**: Repository with thread "thread-1" having empty whitelist
**When**: updateWhitelist("thread-1", ["dist/**", ".env.*"]) is called
**Then**: Thread's whitelistPatterns is updated

## Files to Modify

| File | Action |
|------|--------|
| `src/infrastructure/repositories/JsonThreadStateRepository.ts` | CREATE |
| `src/extension.ts` | MODIFY - wire repository |

## Dependencies

- Task 1: ThreadState entity
- Task 2: IThreadStateRepository interface

## Notes

- Creates `.vscode/` directory if not exists
- Handles concurrent access with file locking pattern
- Similar to existing JsonCommentRepository
