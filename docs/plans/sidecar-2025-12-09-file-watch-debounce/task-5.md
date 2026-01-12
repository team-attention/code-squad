# Task 5: Add Unit Tests for Debounce Logic

## Goal

Comprehensive test coverage for debounce functionality.

## Files to Create

- `src/test/adapters/FileWatchController.test.ts`

## Implementation

Create test file with fake timers for deterministic testing:

```typescript
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

suite('FileWatchController Debounce', () => {
  let clock: sinon.SinonFakeTimers;

  setup(() => {
    clock = sinon.useFakeTimers();
  });

  teardown(() => {
    clock.restore();
  });

  suite('UC1: DebounceRapidChanges', () => {
    test('rapid events coalesced to single processing', async () => {
      // Given: Debounce delay 300ms
      // When: 5 events for same file in 100ms
      // Then: Single processFileChange call after 300ms
    });

    test('different files debounce independently', async () => {
      // Given: Debounce delay 300ms
      // When: file-a at t=0, file-b at t=100ms
      // Then: file-a processed at t=300, file-b at t=400
    });

    test('slow changes processed individually', async () => {
      // Given: Debounce delay 300ms
      // When: Events 500ms apart
      // Then: Each processed separately
    });
  });

  suite('UC2: ConfigureDebounceDelay', () => {
    test('zero delay disables debouncing', async () => {
      // Given: fileWatchDebounceMs = 0
      // When: Event arrives
      // Then: Processed immediately, no timer created
    });

    test('configuration change applies immediately', async () => {
      // Given: Initial delay 300ms
      // When: Changed to 500ms
      // Then: New events use 500ms delay
    });

    test('out of range values clamped', async () => {
      // Given: Value 5000
      // When: Config loaded
      // Then: Effective delay is 2000
    });
  });

  suite('UC3: ProcessDebouncedFileChange', () => {
    test('latest event data used when timer fires', async () => {
      // Given: Events with different timestamps
      // When: Timer fires
      // Then: Uses data from last event
    });

    test('timer cleanup on dispose', async () => {
      // Given: 3 active timers
      // When: dispose() called
      // Then: All timers cleared, maps empty
    });

    test('debounce events logged', async () => {
      // Given: Debug logging enabled
      // When: Events debounced
      // Then: Logs show Scheduled/Coalesced/Fired
    });
  });
});
```

## What to Mock

| Component | Mock Strategy |
|-----------|---------------|
| `vscode.workspace.fs.stat` | Return FileType.File or Directory |
| `vscode.Uri.file()` | Create Uri with `fsPath` property |
| `setTimeout`/`clearTimeout` | Sinon fake timers |
| `vscode.workspace.getConfiguration` | Return mock config object |
| `SessionContext` | Minimal mock with sessions array |
| `IGitPort` | Return fixed GitStatusEntry |
| `ITrackedFilesPort` | Return shouldTrack: true/false |

## Test Setup Pattern

```typescript
// Create minimal FileWatchController for testing
function createTestController(options: {
  debounceMs?: number;
  processCallback?: (data: DebouncedEventData) => Promise<void>;
}) {
  // Mock dependencies
  // Override processFileChange to capture calls
  // Return controller instance
}
```

## Dependencies

May need to add `sinon` and `@types/sinon` to devDependencies if not present:

```bash
npm install --save-dev sinon @types/sinon
```

## Acceptance Criteria

- [ ] Tests for all 3 use cases (9+ test cases)
- [ ] Fake timers for deterministic time control
- [ ] Proper mocking of VSCode APIs
- [ ] Tests verify timer counts
- [ ] Tests verify event coalescing
- [ ] Tests verify configuration changes
- [ ] Tests verify dispose cleanup
- [ ] All tests pass with `npm run test`
