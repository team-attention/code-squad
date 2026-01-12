# Task 4: Add Timer Cleanup and Dispose

## Goal

Ensure all debounce timers are cleaned up on extension deactivation to prevent memory leaks and orphan callbacks.

## Files to Modify

- `src/adapters/inbound/controllers/FileWatchController.ts`
- `src/extension.ts`

## Implementation

### 1. Add dispose() Method to FileWatchController

```typescript
/**
 * Cleanup all debounce timers and pending data.
 * Called when extension deactivates.
 */
dispose(): void {
  const timerCount = this.debounceTimers.size;

  // Clear all pending debounce timers
  for (const [path, timer] of this.debounceTimers) {
    clearTimeout(timer);
    this.log(`[Debounce] Cleanup: ${path}`);
  }

  this.debounceTimers.clear();
  this.pendingEventData.clear();

  if (timerCount > 0) {
    this.log(`Disposed: cleared ${timerCount} pending debounce timers`);
  }
}
```

### 2. Register Dispose in extension.ts

Find where `fileWatchController.activate()` is called and add dispose registration:

```typescript
// After fileWatchController.activate(context)
context.subscriptions.push({
  dispose: () => fileWatchController.dispose()
});
```

This ensures the dispose method is called when the extension is deactivated.

## Test Scenarios

**Scenario 4.1: Timers cleared on dispose**
- Given: 3 active debounce timers for different files
- When: `dispose()` called
- Then: All 3 timers cleared, both Maps empty

**Scenario 4.2: No errors on empty dispose**
- Given: No active timers (both Maps empty)
- When: `dispose()` called
- Then: No errors, completes gracefully

**Scenario 4.3: Logging shows cleanup**
- Given: 2 active timers
- When: `dispose()` called
- Then: Logs show `[Debounce] Cleanup: file-a.ts`, `[Debounce] Cleanup: file-b.ts`

**Scenario 4.4: Timer callbacks don't fire after dispose**
- Given: Active timer for `file.ts` with 5 seconds remaining
- When: `dispose()` called, then 5 seconds pass
- Then: Timer callback never executes

## Acceptance Criteria

- [ ] `dispose()` method added to FileWatchController
- [ ] All timers cleared with `clearTimeout()`
- [ ] `debounceTimers` Map cleared
- [ ] `pendingEventData` Map cleared
- [ ] Logging shows files being cleaned up
- [ ] Dispose registered in extension subscriptions
- [ ] No memory leaks after dispose
