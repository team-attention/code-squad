# Spec: Multi-Session File Routing

## Overview

Enable intelligent comment and action routing based on file-thread mapping in multi-thread environments. When users add comments to files in the Sidecar panel, route those comments to the thread that last modified each file, rather than always routing to the currently focused thread.

## Problem Statement

In the current implementation, when multiple threads work on different files in the same repository:

1. All file changes appear in the Sidecar panel regardless of which thread modified them
2. Comments added to files are always routed to the currently focused thread's terminal
3. Users expect comments on file1.ts (modified by Thread A) to go to Thread A, even if Thread B is currently focused

**Current behavior**: Comment routing follows focused thread only
**Desired behavior**: Comment routing follows file ownership (which thread last modified the file)

This causes confusion when:
- Thread A modifies file1.ts
- Thread B modifies file2.ts
- User switches focus to Thread B
- User adds comment to file1.ts
- Comment incorrectly goes to Thread B instead of Thread A

## Use Cases

### UC-1: Track File Modification by Thread

- **Actor**: File Watch Controller (system)
- **Trigger**: A file is modified and the change is detected
- **Preconditions**:
  - File watch system is active
  - At least one thread session exists
- **Flow**:
  1. File change is detected with file path and terminal ID
  2. System creates or updates file-thread mapping with (filePath, threadId)
  3. Mapping is persisted for lookup during comment routing
- **Business Rules**:
  - Last thread to modify a file becomes the owner
  - Only files appearing in session files should be tracked
  - Mapping is scoped per session/workspace
- **Location**: `application/useCases/TrackFileOwnershipUseCase.ts`

### UC-2: Route Comments to Owner Thread

- **Actor**: User
- **Trigger**: User submits comments via Sidecar panel
- **Preconditions**:
  - User has added one or more comments to files
  - File-thread mappings exist for commented files
- **Flow**:
  1. User clicks submit comments
  2. System groups comments by file
  3. For each file, system looks up owner thread from file-thread mapping
  4. Comments are grouped by owner thread
  5. Each group of comments is sent to its respective owner thread's terminal
  6. User is notified of submission (e.g., "Sent 3 comments to Thread A, 2 comments to Thread B")
- **Business Rules**:
  - If no mapping exists for a file, fall back to currently focused thread (backward compatibility)
  - Comments for the same file must go to the same thread
  - Multiple threads may receive comments in a single submission
- **Location**: `application/useCases/SubmitCommentsUseCase.ts` (modified)

### UC-3: Display File Ownership in UI

- **Actor**: User
- **Trigger**: User views Sidecar panel with file list
- **Preconditions**:
  - Multiple threads exist with file modifications
  - File-thread mappings exist
- **Flow**:
  1. User opens or views Sidecar panel
  2. System retrieves file-thread mappings
  3. For each file in session files, system looks up owner thread
  4. UI displays thread name/identifier next to file name (e.g., "file1.ts [Thread A]")
- **Business Rules**:
  - Only show thread label when multiple threads exist
  - If no mapping exists, show no label
  - UI should be compact and not clutter the file list
- **Location**: `adapters/inbound/ui/webview/components/diff/DiffHeader.ts` (modified)

## Domain Model Changes

### New Entity: FileThreadMapping

Represents the ownership relationship between files and threads.

```typescript
interface FileThreadMappingData {
  filePath: string;
  threadId: string;
  lastModifiedAt: number;
}

class FileThreadMapping {
  readonly filePath: string;
  readonly threadId: string;
  readonly lastModifiedAt: number;

  static create(filePath: string, threadId: string): FileThreadMapping
  toData(): FileThreadMappingData
}
```

### Modified Entity: Comment

Comment already has optional `threadId` field. This will be populated during comment submission based on file-thread mapping lookup.

No structural changes needed to Comment entity.

### New Repository Interface: IFileThreadMappingRepository

```typescript
interface IFileThreadMappingRepository {
  save(mapping: FileThreadMapping): Promise<void>
  findByFilePath(filePath: string): Promise<FileThreadMapping | null>
  findAll(): Promise<FileThreadMapping[]>
  clear(): Promise<void>
}
```

## UI Changes

### Diff Header Enhancement

**Location**: `/Users/eatnug/Workspace/sidecar/src/adapters/inbound/ui/webview/components/diff/DiffHeader.ts`

Add thread ownership badge next to file name in diff header:

```
Before:
  src/domain/entities/User.ts  +12 -5

After:
  src/domain/entities/User.ts [Thread A]  +12 -5
```

Visual design:
- Badge appears as small label with muted styling
- Only shown when multiple threads exist
- Uses thread name from ThreadState
- Positioned between file path and stats

### Submission Notification

**Location**: Existing notification system via `INotificationPort`

Change notification message when submitting comments:

```
Before:
  "Sent 5 comments to Claude"

After (single thread):
  "Sent 5 comments to Thread A"

After (multiple threads):
  "Sent 3 comments to Thread A, 2 comments to Thread B"
```

## Out of Scope

The following are explicitly NOT included in this specification:

1. **Worktree isolation**: This spec assumes threads work on same working directory. Worktree-based thread isolation is separate and already handled by existing worktree watchers.

2. **Conflict resolution**: If the same file is modified by multiple threads simultaneously, last write wins. No conflict detection or resolution.

3. **Historical tracking**: Only current file ownership is tracked. No history of which threads previously owned a file.

4. **Manual thread assignment**: Users cannot manually override or reassign file ownership. It's purely based on modification detection.

5. **Cross-workspace mappings**: File-thread mappings are scoped to current workspace/session only.

6. **Persistent storage**: Mappings are stored in-memory only. They reset when VSCode restarts.

## Open Questions

1. **Should mappings persist across VSCode restarts?**
   - Leaning toward: No, start fresh on each VSCode session to avoid stale mappings
   - Reason: File ownership is session-specific and transient

2. **How to handle files modified by multiple threads in same session?**
   - Proposed: Last thread to modify wins (overwrite mapping)
   - Alternative: Track multiple threads per file (adds complexity)

3. **Should UI show thread badge for all files or only when multiple threads exist?**
   - Proposed: Only when multiple threads exist (reduces noise)
   - Alternative: Always show for clarity

4. **What if focused thread changes while user is typing a comment?**
   - Proposed: Use file-thread mapping at submission time, not at comment creation time
   - Comments are lightweight and don't store thread info until submission

5. **Should we track file ownership for baseline files or only session files?**
   - Proposed: Only session files (files that have been modified)
   - Reason: Baseline files haven't been modified yet, no ownership established
