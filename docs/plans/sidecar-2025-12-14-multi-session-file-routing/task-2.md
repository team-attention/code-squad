# Task 2: Create IFileThreadMappingRepository Port

## Goal

Define the outbound port interface for persisting and retrieving file-thread mappings.

## Layer

Application

## Files

- `src/application/ports/outbound/IFileThreadMappingRepository.ts` - Create new port interface

## Implementation Steps

1. Create interface `IFileThreadMappingRepository` with methods:
   - `save(mapping: FileThreadMapping): Promise<void>` - Save or update mapping
   - `findByFilePath(filePath: string): Promise<FileThreadMapping | null>` - Find by file path
   - `findByThreadId(threadId: string): Promise<FileThreadMapping[]>` - Find all mappings for a thread
   - `findAll(): Promise<FileThreadMapping[]>` - Get all mappings
   - `delete(filePath: string): Promise<boolean>` - Delete mapping for file
   - `clear(): Promise<void>` - Clear all mappings

2. Import `FileThreadMapping` from domain layer

3. Export from `src/application/ports/outbound/index.ts`

## Test Scenarios

None - Interface definition only.

## Reference Code

```typescript
// Pattern from application/ports/outbound/ISnapshotRepository.ts
import { Snapshot } from '../../../domain/entities/Snapshot';

export interface ISnapshotRepository {
    save(snapshot: Snapshot): Promise<void>;
    findByFilePath(filePath: string): Promise<Snapshot | null>;
    findAll(): Promise<Snapshot[]>;
    clear(): Promise<void>;
}
```

## Validation

- [ ] Interface created with all required methods
- [ ] Proper import from domain layer
- [ ] Exported from ports/outbound/index.ts
- [ ] No vscode imports
- [ ] Type check passes
