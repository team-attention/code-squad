# Task 3: Implement Debounced Event Processing

## Goal

Modify `handleFileChange` to debounce events and add processing method.

## Files to Modify

- `src/adapters/inbound/controllers/FileWatchController.ts`

## Implementation

### 1. Extract Processing Logic into New Method

Extract the file change processing logic (currently in `handleFileChange`) into a new method:

```typescript
private async processFileChange(data: DebouncedEventData): Promise<void> {
  const { uri, relativePath, fileName } = data;

  // Move existing logic from handleFileChange here:
  // - Stat check (isDirectory)
  // - shouldTrack filtering
  // - Active session check
  // - Git status query
  // - Session notifications
  // - State/diff updates
}
```

### 2. Modify handleFileChange

Replace immediate processing with debounce scheduling:

```typescript
const handleFileChange = async (uri: vscode.Uri) => {
  const relativePath = vscode.workspace.asRelativePath(uri);
  const fileName = path.basename(relativePath);

  // Keep existing metrics tracking (immediate)
  this.eventCount++;
  this.eventCountWindow.push(Date.now());
  // ... existing rate limiting checks ...

  // Keep early exit checks (immediate, before debounce):
  // - Directory check
  // - shouldTrack check
  // - Active sessions check

  // === NEW DEBOUNCE LOGIC ===

  // If debouncing disabled, process immediately
  if (this.debounceMs === 0) {
    this.pendingEvents++;
    try {
      await this.processFileChange({ uri, relativePath, fileName, timestamp: Date.now() });
    } finally {
      this.pendingEvents--;
    }
    return;
  }

  // Cancel existing timer for this file
  const existingTimer = this.debounceTimers.get(relativePath);
  if (existingTimer) {
    clearTimeout(existingTimer);
    this.log(`[Debounce] Coalesced: ${relativePath}`);
  } else {
    this.log(`[Debounce] Scheduled: ${relativePath} (delay=${this.debounceMs}ms)`);
  }

  // Store latest event data
  this.pendingEventData.set(relativePath, {
    uri,
    relativePath,
    fileName,
    timestamp: Date.now()
  });

  // Schedule debounced processing
  const timer = setTimeout(async () => {
    const eventData = this.pendingEventData.get(relativePath);
    this.debounceTimers.delete(relativePath);
    this.pendingEventData.delete(relativePath);

    if (eventData) {
      this.log(`[Debounce] Fired: ${relativePath} (pending=${this.debounceTimers.size})`);
      this.pendingEvents++;
      try {
        await this.processFileChange(eventData);
      } finally {
        this.pendingEvents--;
      }
    }
  }, this.debounceMs);

  this.debounceTimers.set(relativePath, timer);
};
```

### Key Points

1. **Early exits remain immediate**: Directory check, shouldTrack, session checks happen before debouncing
2. **Metrics still immediate**: Event counting happens right away
3. **Per-file debouncing**: Each file path has its own timer
4. **Coalescing**: Multiple events for same file cancel previous timer
5. **Latest data**: Only most recent event data stored and processed

## Test Scenarios

**Scenario 3.1: Rapid events coalesced**
- Given: 5 events for `src/test.ts` in 50ms, debounceMs=300
- When: Timer fires after 300ms quiet period
- Then: Single `processFileChange` call with latest data

**Scenario 3.2: Debounce disabled works**
- Given: `debounceMs` is 0
- When: Event arrives
- Then: `processFileChange` called immediately (no setTimeout)

**Scenario 3.3: Independent file timers**
- Given: Events for `file-a.ts` at t=0, `file-b.ts` at t=100ms
- When: Timers fire
- Then: `file-a.ts` processed at t=300ms, `file-b.ts` at t=400ms

**Scenario 3.4: Early exits skip debounce**
- Given: Event for directory or untracked file
- When: Event arrives
- Then: Returns early, no timer created

## Acceptance Criteria

- [ ] `processFileChange()` method extracts existing logic
- [ ] `handleFileChange` schedules debounced processing
- [ ] Per-file timers work correctly
- [ ] Zero delay bypasses debounce entirely
- [ ] Coalescing logged with `[Debounce] Coalesced`
- [ ] Timer fire logged with `[Debounce] Fired`
- [ ] Early return checks preserved before debounce
- [ ] `pendingEvents` counter correctly incremented/decremented
