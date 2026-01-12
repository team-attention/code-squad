# File Watch Debouncing

**Slug**: sidecar-2025-12-09-file-watch-debounce
**Created**: 2025-12-09
**Status**: Draft

## Problem

When files change rapidly (e.g., during AI code generation, build processes, or batch operations), Sidecar's file watch system processes every single change event immediately. This causes:

1. **Performance Issues**: Excessive diff generation and UI updates
   - Current metrics show warnings when >50 events occur within 10 seconds
   - Slow event processing warnings appear when processing takes >200ms
   - Each event triggers git status queries, diff generation, and UI updates for all active sessions

2. **Wasted Resources**: Processing intermediate states that will be overwritten
   - Multiple rapid saves to the same file trigger multiple full processing cycles
   - AI assistants often write files incrementally, causing cascading events
   - Build tools may touch multiple files in quick succession

3. **Poor User Experience**: UI flickering and lag during rapid updates
   - Panel updates on every file change event
   - Excessive diff recalculations for files being actively edited

Currently, `FileWatchController` processes events in `handleFileChange` which:
- Performs stat checks, gitignore filtering, git status queries
- Notifies all active sessions
- Regenerates diffs for selected/first files
- Updates panel state immediately

There is no debouncing mechanism, so a file saved 10 times in 2 seconds will trigger 10 complete processing cycles.

## Solution

Add debouncing to file change event handling to batch rapid changes and process only the final state after a quiet period. The debouncing should:

1. **Collect events during the debounce window**: Queue file change events instead of processing immediately
2. **Process only once after quiet period**: Execute full processing when no new events arrive for a configurable delay
3. **Per-file debouncing**: Debounce each file independently so changes to different files don't block each other
4. **Preserve event order**: Ensure the most recent status/state is used when processing
5. **Configurable delay**: Allow users to tune the debounce window (default: 200-500ms)

## Use Cases

### UC1: DebounceRapidChanges

| Item | Description |
|------|-------------|
| **Actor** | File Watch System |
| **Trigger** | File change event received from VSCode FileSystemWatcher |
| **Flow** | 1. Event arrives for file path<br>2. Check if debounce timer exists for this file<br>3. If timer exists, cancel it and store new event data<br>4. If timer doesn't exist, store event data<br>5. Start new debounce timer (configurable delay, default 300ms)<br>6. When timer expires, process the file change with latest stored data<br>7. Clear stored event data and timer for this file |
| **Business Rules** | - Each file has independent debounce timer<br>- Only the most recent event data is kept<br>- Timer resets on each new event for the same file<br>- Processing must use latest file status when executing |
| **Location** | `adapters/inbound/controllers/FileWatchController.ts` |

### UC2: ConfigureDebounceDelay

| Item | Description |
|------|-------------|
| **Actor** | Extension User |
| **Trigger** | User modifies VSCode settings for Sidecar |
| **Flow** | 1. User opens VSCode settings<br>2. Navigates to Sidecar configuration<br>3. Sets `sidecar.fileWatchDebounceMs` value<br>4. FileWatchController reads updated configuration<br>5. New debounce delay applies to subsequent file changes |
| **Business Rules** | - Default value: 300ms<br>- Minimum value: 0ms (debouncing disabled)<br>- Maximum value: 2000ms<br>- Changes take effect immediately without restart |
| **Location** | `adapters/inbound/controllers/FileWatchController.ts`<br>`package.json` (configuration schema) |

### UC3: ProcessDebounced FileChange

| Item | Description |
|------|-------------|
| **Actor** | Debounce Timer |
| **Trigger** | Debounce timer expires (no new events for configured delay) |
| **Flow** | 1. Timer expires for file path<br>2. Retrieve stored event data (uri, status)<br>3. Execute full file change processing (existing logic):<br>   - Stat check<br>   - shouldTrack filtering<br>   - Active session check<br>   - Git status query<br>   - Notify all active sessions<br>   - Update state/diff for selected files<br>4. Clean up: remove timer and stored data |
| **Business Rules** | - Processing logic remains identical to current implementation<br>- Must verify file still exists before processing<br>- Must use fresh git status, not cached from original event<br>- All existing filtering (gitignore, directory check) still applies |
| **Location** | `adapters/inbound/controllers/FileWatchController.ts` |

## Non-Functional Requirements

### Performance
- Debouncing should reduce event processing by 70-90% during rapid change scenarios
- No added latency for single file changes (debounce window should feel instant to users)
- Memory overhead should be minimal (only store current pending events, not history)
- Statistics logging should track debounced vs processed event counts

### Configurability
- Debounce delay configurable via VSCode settings
- Setting name: `sidecar.fileWatchDebounceMs`
- Default: 300ms (balance between responsiveness and batching)
- Setting change should apply immediately without extension reload

### Reliability
- Debouncing must not lose events or file states
- Last event data must always be preserved and processed
- Timer cleanup must prevent memory leaks
- Error in one file's processing must not affect other files

### Observability
- Existing debug logging should show debounce behavior
- Log when events are debounced (e.g., "Debouncing file.ts (X queued)")
- Log when debounced processing executes (e.g., "Processing debounced change for file.ts")
- Metrics should track: debounced events, processed events, average batch size

## Out of Scope

- Debouncing git commit detection (separate concern, already has commit hashing)
- Debouncing configuration change events (rare, not performance critical)
- Throttling (different behavior - executes at fixed intervals vs debouncing which waits for quiet)
- Cross-file batching (e.g., processing multiple files together in one batch)
- Adaptive debounce delays based on event patterns
- UI indication that debouncing is happening (transparent to user)

## Open Questions

1. Should debounce delay vary by file type? (e.g., longer for large files)
   - Initial answer: No, keep simple with single configurable delay

2. Should we provide preset profiles (e.g., "responsive", "balanced", "performance")?
   - Initial answer: Start with single numeric setting, add presets if users request it

3. Should the first event bypass debouncing for immediate feedback?
   - Initial answer: No, consistent behavior is simpler and delay is short enough

4. How should we handle the edge case where a file is deleted during debounce window?
   - Initial answer: Check file existence before processing; skip if deleted
