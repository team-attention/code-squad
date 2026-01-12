# Task 1: Add setCurrentThread to FileWatchController

## Goal

Add method to FileWatchController to track current thread and apply its whitelist patterns.

## Location

`src/adapters/inbound/controllers/FileWatchController.ts`

## Changes

### 1. Add Thread Tracking State

```typescript
class FileWatchController {
    // Add after line ~127 (after debounceMs)
    private currentThreadId: string | null = null;         // terminalId
    private currentThreadPatterns: string[] = [];
    private currentThreadStateId: string | undefined;      // actual threadId for repo ops
}
```

### 2. Add setCurrentThread Method

```typescript
/**
 * Set the current thread and apply its whitelist patterns.
 * Called when user selects a thread in ThreadListController.
 *
 * @param terminalId The terminal ID (null for "All Agents" view)
 * @param patterns The thread's whitelist patterns
 * @param threadStateId The actual thread state ID (for repository operations)
 */
setCurrentThread(
    terminalId: string | null,
    patterns: string[],
    threadStateId?: string
): void {
    this.currentThreadId = terminalId;
    this.currentThreadPatterns = patterns;
    this.currentThreadStateId = threadStateId;
    this.log(`[Thread] Set current thread: ${terminalId ?? 'none'} (patterns=${patterns.length})`);

    // Rebuild effective patterns (global + thread)
    this.rebuildIncludePatterns();
}

/**
 * Rebuild include patterns from global config + current thread patterns.
 */
private rebuildIncludePatterns(): void {
    // Reset and reload global patterns
    this.includePatterns = ignore();

    const config = vscode.workspace.getConfiguration('sidecar');
    const globalPatterns = config.get<string[]>('includeFiles', []);

    if (globalPatterns.length > 0) {
        this.includePatterns.add(globalPatterns);
    }

    // Add current thread patterns
    if (this.currentThreadPatterns.length > 0) {
        this.includePatterns.add(this.currentThreadPatterns);
        this.log(`[Thread] Applied ${this.currentThreadPatterns.length} thread patterns`);
    }

    // Rebuild whitelist watchers with new patterns
    if (this.extensionContext) {
        this.setupWhitelistWatchers(this.extensionContext);
    }
}
```

### 3. Update loadIncludePatterns to Preserve Thread Patterns

Modify `loadIncludePatterns` to call `rebuildIncludePatterns`:

```typescript
private loadIncludePatterns(): void {
    this.rebuildIncludePatterns();
}
```

### 4. Add getCurrentThreadId Getter

```typescript
/**
 * Get the current thread ID.
 * Returns null if no thread is selected.
 */
getCurrentThreadId(): string | null {
    return this.currentThreadId;
}
```

## Test Scenario

**TS1: Thread Selection Applies Whitelist**

```typescript
// Given: Thread A has whitelist pattern "dist/**"
const threadId = "thread-a";
const patterns = ["dist/**"];

// When: User selects Thread A
fileWatchController.setCurrentThread(threadId, patterns);

// Then: Pattern is applied
expect(fileWatchController.getCurrentThreadId()).toBe(threadId);
// And files matching dist/** are tracked
expect(fileWatchController.shouldTrack(distFile)).toBe(true);
```

## Acceptance Criteria

- [ ] `setCurrentThread(id, patterns)` stores thread ID and patterns
- [ ] `rebuildIncludePatterns()` combines global + thread patterns
- [ ] Whitelist watchers are recreated with new patterns
- [ ] `getCurrentThreadId()` returns current thread ID
- [ ] Log messages indicate thread selection
