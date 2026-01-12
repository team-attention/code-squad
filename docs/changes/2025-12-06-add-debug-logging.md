# Add Debug Logging for Crash Investigation

## Summary

Added comprehensive debug logging to investigate Cursor crashes that occur when Claude is actively modifying files.

## Changes

### FileWatchController

- Added event counter and rate tracking (events per second)
- Added pending event queue monitoring
- Added memory usage logging (heap, RSS)
- Added slow operation warnings (git status > 100ms, notify > 100ms, total > 200ms)
- Added periodic stats logging every 10 seconds
- Added high event rate warning (> 50 events in 10 seconds)

### AIDetectionController

- Added session lifecycle logging (activate, flush)
- Added terminal event logging (command start/end, close)
- Added periodic health check every 30 seconds
- Added memory usage per log entry

## Output Channels

Two new output channels available in `View > Output`:

| Channel | Content |
|---------|---------|
| `Sidecar FileWatch` | File events, performance metrics, warnings |
| `Sidecar AI Detection` | Session lifecycle, memory health |

## Log Examples

```
[Sidecar] [17:30:45.123] 📁 Event #123: src/foo.ts (pending=5)
[Sidecar] [17:30:45.124] 📊 STATS: events/sec=3.2, pending=5, maxPending=12, heap=45.2MB
[Sidecar] [17:30:45.125] ⚠️ WARNING: High event rate detected! 52 events in last 10 seconds
[Sidecar:AI] [17:30:45.126] [heap=45.2MB] 💓 Health: sessions=1, heap=45.2MB, rss=120.5MB
```

## Files Modified

- `src/adapters/inbound/controllers/FileWatchController.ts`
- `src/adapters/inbound/controllers/AIDetectionController.ts`
