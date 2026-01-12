# Task 11: Update FileWatchController for Per-Thread Whitelist

## Scope

Update FileWatchController to use thread-specific whitelist patterns.

## Deliverables

1. Update `src/adapters/inbound/controllers/FileWatchController.ts` - Use ManageWhitelistUseCase

## Technical Design

```typescript
// src/adapters/inbound/controllers/FileWatchController.ts
export class FileWatchController {
  constructor(
    // existing deps...
    private readonly manageWhitelistUseCase: IManageWhitelistUseCase,
  ) {}

  // Modify existing method to accept threadId
  async shouldIncludeFile(filePath: string, threadId?: string): Promise<boolean> {
    const globalPatterns = this.getGlobalWhitelistPatterns();
    const effectivePatterns = await this.manageWhitelistUseCase.getEffectivePatterns(
      threadId,
      globalPatterns
    );

    return this.matchesAnyPattern(filePath, effectivePatterns);
  }

  // Modify getChangedFiles to filter by thread
  async getChangedFiles(sessionContext: SessionContext): Promise<string[]> {
    const threadId = sessionContext.threadState?.threadId;
    const allChangedFiles = await this.detectChangedFiles();

    const filtered = await Promise.all(
      allChangedFiles.map(async (file) => {
        const include = await this.shouldIncludeFile(file, threadId);
        return include ? file : null;
      })
    );

    return filtered.filter(Boolean) as string[];
  }

  // Add method for adding pattern to current thread
  async addPatternToThread(pattern: string, threadId: string): Promise<void> {
    await this.manageWhitelistUseCase.execute({
      threadId,
      action: 'add',
      patterns: [pattern],
    });

    // Trigger file list refresh
    this.emit('whitelistChanged', { threadId });
  }

  private getGlobalWhitelistPatterns(): string[] {
    return vscode.workspace.getConfiguration('sidecar').get<string[]>('includeFiles', []);
  }
}
```

## Test Scenarios

### TS11.1: Include File with Global Pattern Only

**Given**: Global whitelist ["dist/**"], no thread whitelist
**When**: shouldIncludeFile("dist/bundle.js", "thread-1")
**Then**: Returns true

### TS11.2: Include File with Thread Pattern

**Given**: Global whitelist [], Thread "thread-1" whitelist ["build/**"]
**When**: shouldIncludeFile("build/output.js", "thread-1")
**Then**: Returns true

### TS11.3: Exclude File Not Matching Any Pattern

**Given**: Global ["dist/**"], Thread "thread-1" ["build/**"]
**When**: shouldIncludeFile("src/index.ts", "thread-1")
**Then**: Returns false (normal git file handling)

### TS11.4: All Agents View - Union of Patterns

**Given**: Thread-1 ["dist/**"], Thread-2 ["build/**"]
**When**: shouldIncludeFile("dist/x.js", undefined)
**Then**: Returns true

**When**: shouldIncludeFile("build/x.js", undefined)
**Then**: Returns true

### TS11.5: Get Changed Files with Thread Filter

**Given**: Changed files ["dist/a.js", "build/b.js"], Thread-1 whitelist ["dist/**"]
**When**: getChangedFiles(sessionContextWithThread1)
**Then**: Returns only ["dist/a.js"]

### TS11.6: Add Pattern to Thread via Controller

**Given**: Thread "thread-1" with empty whitelist
**When**: addPatternToThread("temp/**", "thread-1")
**Then**:
- Pattern added to thread-1's whitelist
- 'whitelistChanged' event emitted

### TS11.7: Pattern Precedence

**Given**: Global denies "*.log", Thread allows "error.log" (hypothetical)
**When**: File matching logic runs
**Then**: Whitelist patterns are additive (union), no deny patterns

## Files to Modify

| File | Action |
|------|--------|
| `src/adapters/inbound/controllers/FileWatchController.ts` | MODIFY - use ManageWhitelistUseCase |

## Dependencies

- Task 10: ManageWhitelistUseCase

## Notes

- Global patterns from `sidecar.includeFiles` config
- Thread patterns are additive (not override)
- "All Agents" view sees union of all patterns
- Whitelist change triggers panel refresh
