# Task 10: Create ManageWhitelistUseCase

## Scope

Implement use case for managing per-thread whitelist patterns.

## Deliverables

1. `src/application/ports/inbound/IManageWhitelistUseCase.ts` - Use case interface
2. `src/application/useCases/ManageWhitelistUseCase.ts` - Implementation
3. Wire in `src/extension.ts`

## Technical Design

```typescript
// src/application/ports/inbound/IManageWhitelistUseCase.ts
export interface ManageWhitelistInput {
  threadId: string;
  action: 'add' | 'remove' | 'set';
  patterns: string[];
}

export interface ManageWhitelistOutput {
  patterns: string[];
}

export interface IManageWhitelistUseCase {
  execute(input: ManageWhitelistInput): Promise<ManageWhitelistOutput>;
  getPatterns(threadId: string): Promise<string[]>;
  getEffectivePatterns(threadId: string | undefined, globalPatterns: string[]): Promise<string[]>;
}

// src/application/useCases/ManageWhitelistUseCase.ts
export class ManageWhitelistUseCase implements IManageWhitelistUseCase {
  constructor(
    private readonly threadStateRepository: IThreadStateRepository,
  ) {}

  async execute(input: ManageWhitelistInput): Promise<ManageWhitelistOutput> {
    const { threadId, action, patterns } = input;
    const threadState = await this.threadStateRepository.findById(threadId);

    if (!threadState) {
      throw new Error(`Thread not found: ${threadId}`);
    }

    let newPatterns: string[];
    switch (action) {
      case 'add':
        newPatterns = [...new Set([...threadState.whitelistPatterns, ...patterns])];
        break;
      case 'remove':
        newPatterns = threadState.whitelistPatterns.filter(p => !patterns.includes(p));
        break;
      case 'set':
        newPatterns = [...patterns];
        break;
    }

    await this.threadStateRepository.updateWhitelist(threadId, newPatterns);
    return { patterns: newPatterns };
  }

  async getPatterns(threadId: string): Promise<string[]> {
    const threadState = await this.threadStateRepository.findById(threadId);
    return threadState?.whitelistPatterns ?? [];
  }

  async getEffectivePatterns(threadId: string | undefined, globalPatterns: string[]): Promise<string[]> {
    if (threadId === undefined) {
      // "All Agents" view: union of global + all thread patterns
      const allThreads = await this.threadStateRepository.findAll();
      const allPatterns = allThreads.flatMap(t => t.whitelistPatterns);
      return [...new Set([...globalPatterns, ...allPatterns])];
    }

    // Specific thread: global + thread patterns
    const threadPatterns = await this.getPatterns(threadId);
    return [...new Set([...globalPatterns, ...threadPatterns])];
  }
}
```

## Test Scenarios

### TS10.1: Add Pattern to Thread

**Given**: Thread "thread-1" with whitelist ["dist/**"]
**When**: execute({ threadId: "thread-1", action: "add", patterns: [".env.*"] })
**Then**: Whitelist becomes ["dist/**", ".env.*"]

### TS10.2: Remove Pattern from Thread

**Given**: Thread "thread-1" with whitelist ["dist/**", ".env.*"]
**When**: execute({ threadId: "thread-1", action: "remove", patterns: ["dist/**"] })
**Then**: Whitelist becomes [".env.*"]

### TS10.3: Set Patterns (Replace All)

**Given**: Thread "thread-1" with whitelist ["dist/**"]
**When**: execute({ threadId: "thread-1", action: "set", patterns: ["build/**"] })
**Then**: Whitelist becomes ["build/**"]

### TS10.4: Add Duplicate Pattern

**Given**: Thread "thread-1" with whitelist ["dist/**"]
**When**: execute({ threadId: "thread-1", action: "add", patterns: ["dist/**"] })
**Then**: Whitelist stays ["dist/**"] (no duplicate)

### TS10.5: Get Patterns for Thread

**Given**: Thread "thread-1" with whitelist ["dist/**"]
**When**: getPatterns("thread-1")
**Then**: Returns ["dist/**"]

### TS10.6: Get Effective Patterns - Specific Thread

**Given**: Global patterns ["*.log"], Thread "thread-1" patterns ["dist/**"]
**When**: getEffectivePatterns("thread-1", ["*.log"])
**Then**: Returns ["*.log", "dist/**"]

### TS10.7: Get Effective Patterns - All Agents View

**Given**: Global ["*.log"], Thread-1 ["dist/**"], Thread-2 ["build/**"]
**When**: getEffectivePatterns(undefined, ["*.log"])
**Then**: Returns ["*.log", "dist/**", "build/**"]

### TS10.8: Thread Not Found

**Given**: No thread "invalid-id"
**When**: execute({ threadId: "invalid-id", action: "add", patterns: ["x"] })
**Then**: Throws "Thread not found" error

## Files to Modify

| File | Action |
|------|--------|
| `src/application/ports/inbound/IManageWhitelistUseCase.ts` | CREATE |
| `src/application/useCases/ManageWhitelistUseCase.ts` | CREATE |
| `src/extension.ts` | MODIFY - wire use case |

## Dependencies

- Task 1: ThreadState entity (whitelistPatterns)
- Task 2: IThreadStateRepository
- Task 3: JsonThreadStateRepository (implementation)

## Notes

- Patterns are deduplicated using Set
- Global patterns from config are combined with thread-specific
- "All Agents" view shows union of all patterns
