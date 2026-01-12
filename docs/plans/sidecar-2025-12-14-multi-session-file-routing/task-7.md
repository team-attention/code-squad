# Task 7: Extend FileInfo and Propagate Owner Info

## Goal

Add owner thread information to FileInfo interface and populate it when building panel state.

## Layer

Application / Adapter

## Files

- `src/application/ports/outbound/PanelState.ts` - Extend FileInfo interface
- `src/adapters/inbound/ui/PanelStateManager.ts` - Populate owner info when building state

## Implementation Steps

### 1. Extend FileInfo Interface

In `PanelState.ts`, add new fields to `FileInfo`:

```typescript
export interface FileInfo {
    path: string;
    name: string;
    status: 'modified' | 'added' | 'deleted';
    agentName?: string;
    agentColorIndex?: number;
    ownerThreadId?: string;      // NEW
    ownerThreadName?: string;    // NEW
}
```

### 2. Update PanelStateManager

In `PanelStateManager.ts`:

1. Add `IFileThreadMappingRepository` as constructor dependency

2. In the method that builds `sessionFiles` (likely `buildPanelState` or similar):
   - For each file, lookup owner from mapping repository
   - If mapping exists, populate `ownerThreadId` and `ownerThreadName`
   - Get thread name from `IThreadStateRepository.findById(threadId)`

3. Pseudocode:
   ```typescript
   async buildFileInfo(filePath: string): Promise<FileInfo> {
       const mapping = await this.mappingRepository.findByFilePath(filePath);
       let ownerThreadId: string | undefined;
       let ownerThreadName: string | undefined;

       if (mapping) {
           ownerThreadId = mapping.threadId;
           const thread = await this.threadStateRepository.findById(mapping.threadId);
           ownerThreadName = thread?.name;
       }

       return {
           path: filePath,
           name: path.basename(filePath),
           status: /* ... */,
           ownerThreadId,
           ownerThreadName,
       };
   }
   ```

### 3. Add Thread Count to Panel State

To know when to show badges (only when multiple threads exist), add:

```typescript
export interface PanelState {
    // ... existing fields
    threadCount: number;  // NEW: Total number of active threads
}
```

## Test Scenarios

None - Data propagation. Verified through UI in task-8.

## Validation

- [ ] FileInfo extended with owner fields
- [ ] PanelStateManager populates owner info
- [ ] Thread count added to PanelState
- [ ] No vscode imports in PanelState.ts
- [ ] Type check passes
