# Implementation Plan: File Watch Debouncing

**Spec**: [sidecar-2025-12-09-file-watch-debounce](../../specs/sidecar-2025-12-09-file-watch-debounce.md)
**Created**: 2025-12-09

## Overview

Add debouncing to Sidecar's file watch system to prevent performance issues during rapid file changes (AI code generation, build processes). Uses per-file debouncing with configurable delay, preserving only the most recent event data.

## Problem Summary

| Issue | Impact | Solution |
|-------|--------|----------|
| Every file change processed immediately | High CPU, UI flicker | Per-file debounce timers |
| Intermediate states processed | Wasted diff generation | Only process after quiet period |
| No configuration option | Users cannot tune behavior | Add `sidecar.fileWatchDebounceMs` setting |
| Rapid events flood processing queue | Memory/performance degradation | Coalesce to single event per file |

## Technical Design

### Core Architecture

The debounce mechanism will be implemented entirely within `FileWatchController.ts` in the adapters layer:

1. **Layer Boundary**: Debouncing is an adapter-level concern (controlling event flow from VSCode file system watcher)
2. **No Domain Impact**: Business logic (diff generation, session management) remains unchanged
3. **Single File Change**: Localized modification reduces risk

### Data Structures

```typescript
/** Pending debounced event data */
interface DebouncedEventData {
  uri: vscode.Uri;
  relativePath: string;
  fileName: string;
  timestamp: number;
}

// In FileWatchController class:
private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
private pendingEventData: Map<string, DebouncedEventData> = new Map();
private debounceMs: number = 300;
```

### Algorithm

```
1. File change event arrives (uri)
2. Cancel any existing timer for this file path
3. Store latest event data for this file path
4. Start new timer with configured delay
5. When timer fires:
   a. Retrieve stored event data
   b. Execute full processing logic
   c. Clean up timer and stored data
```

### Configuration

Add to `package.json`:

```json
"sidecar.fileWatchDebounceMs": {
  "type": "number",
  "default": 300,
  "minimum": 0,
  "maximum": 2000,
  "description": "Debounce delay for file change events in milliseconds. Set to 0 to disable."
}
```

### Observability

```typescript
this.log(`[Debounce] Scheduled: ${relativePath} (delay=${this.debounceMs}ms)`);
this.log(`[Debounce] Coalesced: ${relativePath} (reset timer)`);
this.log(`[Debounce] Fired: ${relativePath} (pending=${this.debounceTimers.size})`);
```

## Task List

| # | Task | Files | Description |
|---|------|-------|-------------|
| 1 | [Add package.json configuration](./task-1.md) | `package.json` | Add `sidecar.fileWatchDebounceMs` setting |
| 2 | [Add debounce data structures](./task-2.md) | `FileWatchController.ts` | Add Maps, interface, config loading |
| 3 | [Implement debounced event processing](./task-3.md) | `FileWatchController.ts` | Modify handleFileChange, add processFileChange |
| 4 | [Add timer cleanup and dispose](./task-4.md) | `FileWatchController.ts`, `extension.ts` | Cleanup on extension deactivation |
| 5 | [Add unit tests](./task-5.md) | `FileWatchController.test.ts` | Test debounce behavior |

## Dependencies

```
Task 1 (package.json config)
    ↓
Task 2 (data structures + config loading)
    ↓
Task 3 (debounce implementation)
    ↓
Task 4 (cleanup)
    ↓
Task 5 (tests)
```

## Test Scenarios Summary

### UC1: DebounceRapidChanges
- 1.1: 5 events in 100ms → single processing after 300ms quiet
- 1.2: Events to file-a and file-b → each processed independently
- 1.3: Events 500ms apart → each processed separately

### UC2: ConfigureDebounceDelay
- 2.1: `fileWatchDebounceMs` = 0 → immediate processing
- 2.2: Setting changed → new events use new delay
- 2.3: Value > 2000 → clamped to 2000

### UC3: ProcessDebouncedFileChange
- 3.1: Multiple events → latest data used
- 3.2: Panel disposed → all timers cleared
- 3.3: Debug logging → debounce events logged

## Success Criteria

- [ ] 70-90% reduction in events during rapid changes
- [ ] No memory leaks (timers cleaned up)
- [ ] Configuration works (0=disabled, 300 default, 2000 max)
- [ ] Existing functionality preserved
- [ ] Observability logs show debounce behavior
- [ ] All tests pass

## Rollback Plan

If issues arise:
1. Set `sidecar.fileWatchDebounceMs` to 0 (disables debouncing)
2. Revert changes (single file modification to `FileWatchController.ts` + `package.json`)

## Critical Files

- `src/adapters/inbound/controllers/FileWatchController.ts` - Core implementation
- `package.json` - Configuration schema
- `src/extension.ts` - Dispose wiring
- `src/adapters/inbound/ui/webview/components/sidebar/FileSearch.ts` - Existing debounce pattern to follow
