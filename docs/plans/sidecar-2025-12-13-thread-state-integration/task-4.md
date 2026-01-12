# Task 4: Update Whitelist Pattern Addition Flow

## Goal

When adding a whitelist pattern, save to current thread's state if a thread is selected, otherwise save to global config (existing behavior).

## Location

`src/adapters/inbound/controllers/FileWatchController.ts`

## Changes

### 1. Add ThreadStateRepository Dependency

FileWatchController needs access to persist ThreadState changes.

```typescript
import { IThreadStateRepository } from '../../../application/ports/outbound/IThreadStateRepository';

// Add to class properties
private threadStateRepository: IThreadStateRepository | undefined;
private currentThreadStateId: string | undefined; // threadId (not terminalId)

// Add setter
setThreadStateRepository(repo: IThreadStateRepository): void {
    this.threadStateRepository = repo;
}
```

### 2. Update setCurrentThread to Track threadStateId

```typescript
setCurrentThread(
    terminalId: string | null,
    patterns: string[],
    threadStateId?: string  // NEW: actual threadId for repository operations
): void {
    this.currentThreadId = terminalId;
    this.currentThreadPatterns = patterns;
    this.currentThreadStateId = threadStateId;  // NEW
    // ... rest of existing code
}
```

### 3. Add addWhitelistPattern Method

```typescript
/**
 * Add a whitelist pattern.
 * If a thread is selected, saves to thread state.
 * Otherwise, saves to global config.
 *
 * @param pattern The glob pattern to add
 */
async addWhitelistPattern(pattern: string): Promise<void> {
    if (this.currentThreadStateId && this.threadStateRepository) {
        // Save to current thread using the efficient updateWhitelist method
        const newPatterns = [...this.currentThreadPatterns];
        if (!newPatterns.includes(pattern)) {
            newPatterns.push(pattern);
            await this.threadStateRepository.updateWhitelist(this.currentThreadStateId, newPatterns);
            this.log(`[Thread] Added pattern "${pattern}" to thread ${this.currentThreadStateId}`);

            // Update current patterns and rebuild
            this.currentThreadPatterns = newPatterns;
            this.rebuildIncludePatterns();
            return;
        }
        return; // Pattern already exists
    }

    // Fallback: Save to global config (existing behavior)
    const config = vscode.workspace.getConfiguration('sidecar');
    const current = config.get<string[]>('includeFiles', []);
    if (!current.includes(pattern)) {
        await config.update('includeFiles', [...current, pattern], vscode.ConfigurationTarget.Workspace);
        this.log(`[Global] Added pattern "${pattern}" to global config`);
    }
}
```

### 4. IThreadStateRepository Interface (Already Exists)

Located at `src/application/ports/outbound/IThreadStateRepository.ts`:

```typescript
interface IThreadStateRepository {
    save(state: ThreadState): Promise<void>;
    findAll(): Promise<ThreadState[]>;
    findById(threadId: string): Promise<ThreadState | null>;
    findByTerminalId(terminalId: string): Promise<ThreadState | null>;
    delete(threadId: string): Promise<boolean>;
    updateWhitelist(threadId: string, patterns: string[]): Promise<void>;  // Use this
}
```

## Test Scenarios

**TS4: Add Whitelist Pattern Saves to Thread**

```typescript
// Given: Thread A is selected
fileWatchController.setCurrentThread('thread-a', []);

// When: User adds whitelist pattern
await fileWatchController.addWhitelistPattern('build/**');

// Then: ThreadState is updated
expect(threadState.hasWhitelistPattern('build/**')).toBe(true);
// And: Repository save was called
expect(threadStateRepository.save).toHaveBeenCalledWith(threadState);
```

**TS5: No Thread Selected - Global Behavior**

```typescript
// Given: No thread is selected
fileWatchController.setCurrentThread(null, []);

// When: User adds whitelist pattern
await fileWatchController.addWhitelistPattern('build/**');

// Then: Pattern is saved to global config
const config = vscode.workspace.getConfiguration('sidecar');
expect(config.get('includeFiles')).toContain('build/**');
```

## Acceptance Criteria

- [ ] `addWhitelistPattern` saves to ThreadState when thread is selected
- [ ] `addWhitelistPattern` saves to global config when no thread selected
- [ ] ThreadStateRepository is wired for persistence
- [ ] Current thread patterns are updated after adding
- [ ] Whitelist watchers are rebuilt after adding pattern
