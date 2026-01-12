# Task 3: Implement InMemoryFileThreadMappingRepository

## Goal

Create the in-memory implementation of the file-thread mapping repository.

## Layer

Infrastructure

## Files

- `src/infrastructure/repositories/InMemoryFileThreadMappingRepository.ts` - Create new repository

## Implementation Steps

1. Create class `InMemoryFileThreadMappingRepository` implementing `IFileThreadMappingRepository`

2. Use `Map<string, FileThreadMapping>` for internal storage (key = filePath)

3. Implement all interface methods:
   - `save()` - Upsert into map
   - `findByFilePath()` - Direct lookup by key
   - `findByThreadId()` - Filter all values by threadId
   - `findAll()` - Return all values
   - `delete()` - Remove from map
   - `clear()` - Clear map

4. Export from `src/infrastructure/repositories/index.ts`

## Test Scenarios

### TDD Order

1. Write test for TS8 (Save and Find) → implement → pass
2. Write test for TS9 (Clear All) → implement → pass

### TS8: Save and Find

```pseudo
// Arrange
repository = new InMemoryFileThreadMappingRepository()
mapping = FileThreadMapping.create({ filePath: "src/app.ts", threadId: "tid-a" })

// Act
await repository.save(mapping)
result = await repository.findByFilePath("src/app.ts")

// Assert
expect(result).not.toBeNull()
expect(result.threadId).toBe("tid-a")
```

### TS9: Clear All

```pseudo
// Arrange
repository = new InMemoryFileThreadMappingRepository()
await repository.save(mapping1)
await repository.save(mapping2)

// Act
await repository.clear()
result = await repository.findAll()

// Assert
expect(result).toHaveLength(0)
```

## Reference Code

```typescript
// Pattern from infrastructure/repositories/InMemorySnapshotRepository.ts
import { Snapshot } from '../../domain/entities/Snapshot';
import { ISnapshotRepository } from '../../application/ports/outbound/ISnapshotRepository';

export class InMemorySnapshotRepository implements ISnapshotRepository {
    private snapshots: Map<string, Snapshot> = new Map();

    async save(snapshot: Snapshot): Promise<void> {
        this.snapshots.set(snapshot.filePath, snapshot);
    }

    async findByFilePath(filePath: string): Promise<Snapshot | null> {
        return this.snapshots.get(filePath) ?? null;
    }

    async findAll(): Promise<Snapshot[]> {
        return Array.from(this.snapshots.values());
    }

    async clear(): Promise<void> {
        this.snapshots.clear();
    }
}
```

## Validation

- [ ] All interface methods implemented
- [ ] Test scenarios TS8, TS9 pass
- [ ] Follows InMemorySnapshotRepository pattern
- [ ] Exported from repositories/index.ts
- [ ] Type check passes
