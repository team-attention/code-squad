# Task 3: Extend PanelStateManager with Baseline Logic

## Goal

Implement the baseline management methods in PanelStateManager.

## Dependencies

- Task 2 (PanelState and IPanelStateManager updates)

## Files to Modify

1. `src/application/services/PanelStateManager.ts`

## Implementation

### PanelStateManager.ts

Update the implementation to handle baseline and session file separation:

```typescript
export class PanelStateManager implements IPanelStateManager {
    private state: PanelState;
    private panelPort: IPanelPort | null = null;
    private baselineSet: Set<string> = new Set(); // For O(1) lookup

    constructor() {
        this.state = createInitialPanelState();
    }

    // ... existing methods (setPanelPort, clearPanelPort, getState)

    // ===== Session file operations (renamed from file operations) =====

    addSessionFile(file: FileInfo): void {
        const exists = this.state.sessionFiles.some(f => f.path === file.path);
        if (!exists) {
            this.state = {
                ...this.state,
                sessionFiles: [...this.state.sessionFiles, file],
            };
            this.render();
        }
    }

    removeSessionFile(path: string): void {
        const newFiles = this.state.sessionFiles.filter(f => f.path !== path);
        if (newFiles.length !== this.state.sessionFiles.length) {
            this.state = {
                ...this.state,
                sessionFiles: newFiles,
                selectedFile: this.state.selectedFile === path ? null : this.state.selectedFile,
                diff: this.state.diff?.file === path ? null : this.state.diff,
            };
            this.render();
        }
    }

    // ===== Baseline operations =====

    setBaseline(files: FileInfo[]): void {
        this.baselineSet = new Set(files.map(f => f.path));
        this.state = {
            ...this.state,
            uncommittedFiles: files,
        };
        this.render();
    }

    isInBaseline(path: string): boolean {
        return this.baselineSet.has(path);
    }

    moveToSession(path: string): void {
        if (!this.isInBaseline(path)) return;

        // Find the file in uncommittedFiles
        const file = this.state.uncommittedFiles.find(f => f.path === path);
        if (!file) return;

        // Remove from baseline
        this.baselineSet.delete(path);

        // Update state
        this.state = {
            ...this.state,
            uncommittedFiles: this.state.uncommittedFiles.filter(f => f.path !== path),
            sessionFiles: [...this.state.sessionFiles, file],
        };
        this.render();
    }

    clearBaseline(): void {
        this.baselineSet.clear();
        this.state = {
            ...this.state,
            uncommittedFiles: [],
        };
        this.render();
    }

    // ===== Toggle =====

    toggleShowUncommitted(): void {
        this.state = {
            ...this.state,
            showUncommitted: !this.state.showUncommitted,
        };
        this.render();
    }

    setShowUncommitted(show: boolean): void {
        if (this.state.showUncommitted !== show) {
            this.state = {
                ...this.state,
                showUncommitted: show,
            };
            this.render();
        }
    }

    // ===== Reset (updated) =====

    reset(): void {
        this.baselineSet.clear();
        this.state = createInitialPanelState();
        this.render();
    }

    // ... rest of existing methods (selectFile, showDiff, clearDiff, comment ops, etc.)
}
```

## Key Design Decisions

1. **`baselineSet`**: Separate Set for O(1) lookup performance
2. **`moveToSession()`**: Atomically moves file from uncommitted to session
3. **`reset()`**: Clears both baselineSet and state

## Validation

- [ ] `setBaseline()` stores files and populates baselineSet
- [ ] `isInBaseline()` returns true for baseline files
- [ ] `moveToSession()` removes from uncommitted and adds to session
- [ ] `toggleShowUncommitted()` flips the boolean
- [ ] `reset()` clears everything including baselineSet
