# Spec: Session-based Diff Tracking

## Overview

Track file changes with session-based scope, distinguishing between files modified during the current AI session vs files that were uncommitted before the session started.

## Problem Statement

Git views the world as "committed vs uncommitted", but users want "this session vs previous uncommitted vs committed". Currently, Sidecar shows all changed files without distinguishing whether they were modified by the AI agent in this session or were pre-existing uncommitted changes.

**User need**: "I want to see only the files that the AI modified in this work session, not my other uncommitted work."

## Requirements

### Functional Requirements

1. **Baseline Capture**: On AI session start, capture baseline from two sources:
   - Git uncommitted files (`git status`)
   - Existing files matching `includePatterns` config (gitignored but allowed)
2. **Session File Tracking**: Track files modified after session start as "session files"
3. **Baseline Movement**: If a baseline file is modified during the session, move it to session files
4. **Toggle UI**: Provide toggle to show/hide pre-session uncommitted files
5. **Visual Distinction**: Show pre-session files with different background color when toggle is on
6. **Auto-close Panel**: Close Sidecar panel when AI terminal closes (lifecycle bound to AI terminal)

### Non-functional Requirements

1. Baseline stored in memory only (no persistence needed)
2. Toggle state defaults to "off" (hidden)
3. Toggle state resets on session end

## Success Criteria

- [ ] Session start captures baseline from `git status` + `includePatterns` glob
- [ ] New file changes during session appear in session files list
- [ ] Pre-session uncommitted files appear only when toggle is on
- [ ] Modifying a baseline file during session moves it to session files
- [ ] Pre-session files visually distinguished by background color
- [ ] Sidecar panel closes when AI terminal closes (not viceversa)

## Technical Design

### State Model

```typescript
interface PanelState {
    sessionFiles: FileInfo[];      // Files modified in this session
    uncommittedFiles: FileInfo[];  // Pre-session uncommitted (baseline)
    showUncommitted: boolean;      // Toggle state (default: false)
    // ... existing fields
}
```

### Baseline Flow

```
AI Session Start
    │
    ├──► IGitPort.getUncommittedFiles()     ──► gitFiles
    │
    ├──► IFileGlobber.glob(includePatterns) ──► configFiles (existing only)
    │
    ▼
baseline = Set(gitFiles ∪ configFiles)
    │
    ▼
Store baseline in memory (controller or state manager)
```

### File Change Flow

```
File Changed (FileWatchController)
    │
    ▼
Is file in baseline?
    │
    ├─ Yes: Remove from uncommittedFiles, add to sessionFiles
    │
    └─ No: Add to sessionFiles
```

### Session End Flow

```
AI Terminal Close (onDidCloseTerminal)
    │
    ▼
Close Sidecar panel, clear state
```

Note: Sidecar lifecycle is bound to the AI terminal. AI terminal closes → Sidecar closes.

## Affected Components

| Component | Change |
|-----------|--------|
| `IGitPort` | Add `getUncommittedFiles()` method |
| `VscodeGitGateway` | Implement `getUncommittedFiles()` |
| `PanelState` | Add `sessionFiles`, `uncommittedFiles`, `showUncommitted` |
| `PanelStateManager` | Add methods for file categorization and toggle |
| `AIDetectionController` | Capture baseline on session start, close panel on end |
| `FileWatchController` | Check baseline when handling file changes |
| `SidecarPanelAdapter` | Handle toggle message, render with visual distinction |
| Webview UI | Toggle button, background color styling |

## Out of Scope

- Persisting baseline across VSCode restarts
- Multiple concurrent session tracking (separate baselines per AI session)
- Undo/rollback of session changes

## Notes

- Baseline combines two sources:
  - `git status --porcelain` for uncommitted git-tracked files
  - `glob(includePatterns)` for gitignored but config-allowed files
- Files are identified by relative path from workspace root
- Baseline is a simple Set for O(1) lookup performance
