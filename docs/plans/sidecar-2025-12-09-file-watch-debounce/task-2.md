# Task 2: Add Debounce Data Structures and Config Loading

## Goal

Add the data structures and configuration loading for debouncing to FileWatchController.

## Files to Modify

- `src/adapters/inbound/controllers/FileWatchController.ts`

## Implementation

### 1. Add Interface (before class definition)

```typescript
/** Pending debounced event data */
interface DebouncedEventData {
  uri: vscode.Uri;
  relativePath: string;
  fileName: string;
  timestamp: number;
}
```

### 2. Add Member Variables (after existing metrics variables)

```typescript
/** Per-file debounce timers */
private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

/** Stored event data for pending debounced events */
private pendingEventData: Map<string, DebouncedEventData> = new Map();

/** Current debounce delay in ms (0 = disabled) */
private debounceMs: number = 300;
```

### 3. Add Config Loading Method

```typescript
private loadDebounceConfig(): void {
  const config = vscode.workspace.getConfiguration('sidecar');
  const configValue = config.get<number>('fileWatchDebounceMs', 300);
  // Clamp to valid range
  this.debounceMs = Math.max(0, Math.min(2000, configValue));
  this.log(`Debounce config loaded: ${this.debounceMs}ms`);
}
```

### 4. Call in initialize()

Add `this.loadDebounceConfig()` call in the `initialize()` method.

### 5. Add Configuration Listener

In `activate()`, extend the configuration change listener to also reload debounce config when `sidecar.fileWatchDebounceMs` changes:

```typescript
// Look for existing onDidChangeConfiguration listener
// Add check for fileWatchDebounceMs change
if (e.affectsConfiguration('sidecar.fileWatchDebounceMs')) {
  this.loadDebounceConfig();
}
```

## Test Scenarios

**Scenario 2.1: Default config loaded**
- Given: No user configuration
- When: Controller initializes
- Then: `debounceMs` is 300

**Scenario 2.2: Custom config loaded**
- Given: User sets `sidecar.fileWatchDebounceMs` to 500
- When: Controller initializes
- Then: `debounceMs` is 500

**Scenario 2.3: Out of range clamped**
- Given: User sets value to 5000
- When: Config loaded
- Then: `debounceMs` is 2000 (max)

**Scenario 2.4: Negative value clamped**
- Given: User sets value to -100
- When: Config loaded
- Then: `debounceMs` is 0 (min)

## Acceptance Criteria

- [ ] `DebouncedEventData` interface defined
- [ ] `debounceTimers` Map added
- [ ] `pendingEventData` Map added
- [ ] `debounceMs` variable initialized to 300
- [ ] `loadDebounceConfig()` method implemented with clamping
- [ ] Config loaded on `initialize()`
- [ ] Config reloaded on setting change
