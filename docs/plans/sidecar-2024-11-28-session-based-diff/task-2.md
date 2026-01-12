# Task 2: Update PanelState with Session Tracking

## Goal

Add fields to distinguish session files from pre-session uncommitted files.

## Files to Modify

1. `src/application/ports/outbound/PanelState.ts`
2. `src/application/services/IPanelStateManager.ts`

## Implementation

### 1. PanelState.ts

Rename `files` to `sessionFiles` and add new fields:

```typescript
/**
 * Complete panel state - single source of truth for UI
 */
export interface PanelState {
    sessionFiles: FileInfo[];        // Files modified in this session (renamed from files)
    uncommittedFiles: FileInfo[];    // Pre-session uncommitted (baseline)
    showUncommitted: boolean;        // Toggle state (default: false)
    selectedFile: string | null;
    diff: DiffResult | null;
    comments: CommentInfo[];
    aiStatus: AIStatus;
}

/**
 * Create initial empty state
 */
export function createInitialPanelState(): PanelState {
    return {
        sessionFiles: [],
        uncommittedFiles: [],
        showUncommitted: false,
        selectedFile: null,
        diff: null,
        comments: [],
        aiStatus: { active: false },
    };
}
```

### 2. IPanelStateManager.ts

Add methods for baseline management and toggle:

```typescript
export interface IPanelStateManager {
    // State access
    getState(): PanelState;

    // Session file operations (renamed from file operations)
    addSessionFile(file: FileInfo): void;
    removeSessionFile(path: string): void;
    selectFile(path: string | null): void;

    // Baseline operations (NEW)
    setBaseline(files: FileInfo[]): void;
    isInBaseline(path: string): boolean;
    moveToSession(path: string): void;
    clearBaseline(): void;

    // Toggle (NEW)
    toggleShowUncommitted(): void;
    setShowUncommitted(show: boolean): void;

    // Diff operations
    showDiff(diff: DiffResult): void;
    clearDiff(): void;

    // Comment operations
    addComment(comment: CommentInfo): void;
    removeComment(id: string): void;
    clearComments(): void;

    // AI status
    setAIStatus(status: AIStatus): void;

    // Reset state
    reset(): void;
}
```

## Migration Notes

- `files` field renamed to `sessionFiles` for clarity
- `addFile()` renamed to `addSessionFile()`
- `removeFile()` renamed to `removeSessionFile()`
- Backward compatibility: Update all callers (FileWatchController, etc.)

## Validation

- [ ] PanelState has `sessionFiles`, `uncommittedFiles`, `showUncommitted` fields
- [ ] `createInitialPanelState()` returns correct defaults
- [ ] IPanelStateManager has baseline and toggle methods
