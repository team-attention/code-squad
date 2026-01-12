# Implementation Plan: Session-based Diff Tracking

## Overview

Track file changes with session-based scope, distinguishing between files modified during the current AI session vs files that were uncommitted before the session started.

**Spec**: `docs/specs/sidecar-2024-11-28-session-based-diff.md`

## Scope

- **Size**: MEDIUM
- **Total Tasks**: 7
- **Files Affected**: ~10

## Architecture Compliance

All changes follow hexagonal architecture:
- Domain: No changes (pure business logic preserved)
- Application: Port interfaces and state management
- Adapters: VSCode-specific implementations

## Task List

| # | Task | Files | Dependencies |
|---|------|-------|--------------|
| 1 | [Add getUncommittedFiles to Git port](./task-1.md) | IGitPort.ts, VscodeGitGateway.ts | None |
| 2 | [Update PanelState with session tracking](./task-2.md) | PanelState.ts, IPanelStateManager.ts | None |
| 3 | [Extend PanelStateManager with baseline logic](./task-3.md) | PanelStateManager.ts | Task 2 |
| 4 | [Capture baseline on AI session start](./task-4.md) | AIDetectionController.ts | Tasks 1, 3 |
| 5 | [Check baseline in file change handler](./task-5.md) | FileWatchController.ts | Task 3 |
| 6 | [Close panel on AI terminal close](./task-6.md) | AIDetectionController.ts | None |
| 7 | [Add toggle UI and visual distinction](./task-7.md) | SidecarPanelAdapter.ts | Tasks 2, 3 |

## Data Flow

```
AI Session Start
    │
    ├──► IGitPort.getUncommittedFiles()     ──► gitFiles
    │
    ├──► IFileGlobber.glob(includePatterns) ──► configFiles
    │
    ▼
baseline = Set(gitFiles ∪ configFiles)
    │
    ▼
Store in PanelStateManager.uncommittedFiles
```

```
File Changed
    │
    ▼
Is file in baseline?
    │
    ├─ Yes: Move from uncommittedFiles to sessionFiles
    │
    └─ No: Add to sessionFiles
```

```
AI Terminal Close
    │
    ▼
Close Sidecar panel, reset state
```

## Success Criteria

From spec:
- [ ] Session start captures baseline from `git status` + `includePatterns` glob
- [ ] New file changes during session appear in session files list
- [ ] Pre-session uncommitted files appear only when toggle is on
- [ ] Modifying a baseline file during session moves it to session files
- [ ] Pre-session files visually distinguished by background color
- [ ] Sidecar panel closes when AI terminal closes
