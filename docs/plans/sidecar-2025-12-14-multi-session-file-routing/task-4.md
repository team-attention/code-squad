# Task 4: Create TrackFileOwnershipUseCase

## Goal

Create the use case that records which thread last modified a file.

## Layer

Application

## Files

- `src/application/ports/inbound/ITrackFileOwnershipUseCase.ts` - Create inbound port
- `src/application/useCases/TrackFileOwnershipUseCase.ts` - Create use case implementation

## Implementation Steps

1. Create inbound port interface:
   ```typescript
   export interface TrackFileOwnershipInput {
       filePath: string;
       threadId: string;
   }

   export interface ITrackFileOwnershipUseCase {
       execute(input: TrackFileOwnershipInput): Promise<void>;
   }
   ```

2. Create use case implementation:
   - Inject `IFileThreadMappingRepository`
   - In `execute()`:
     - Skip if threadId is empty/null
     - Create new `FileThreadMapping` via `FileThreadMapping.create()`
     - Save to repository (overwrites existing)

3. Export from `src/application/useCases/index.ts` and `src/application/ports/inbound/index.ts`

## Test Scenarios

### TDD Order

1. Write test for TS1 (Happy Path) → implement → pass
2. Write test for TS2 (Overwrite Existing) → implement → pass

### TS1: TrackFileOwnership - Happy Path

```pseudo
// Arrange
mockRepository = {
  save: vi.fn(),
  findByFilePath: vi.fn(() => null)
}
useCase = new TrackFileOwnershipUseCase(mockRepository)
input = { filePath: "src/app.ts", threadId: "tid-a" }

// Act
await useCase.execute(input)

// Assert
expect(mockRepository.save).toHaveBeenCalledWith(
  expect.objectContaining({
    filePath: "src/app.ts",
    threadId: "tid-a",
    lastModifiedAt: expect.any(Number)
  })
)
```

### TS2: TrackFileOwnership - Overwrite Existing Mapping

```pseudo
// Arrange
existingMapping = { filePath: "src/app.ts", threadId: "old-tid", lastModifiedAt: 100 }
mockRepository = {
  save: vi.fn(),
  findByFilePath: vi.fn(() => existingMapping)
}
useCase = new TrackFileOwnershipUseCase(mockRepository)
input = { filePath: "src/app.ts", threadId: "new-tid" }

// Act
await useCase.execute(input)

// Assert
expect(mockRepository.save).toHaveBeenCalledWith(
  expect.objectContaining({
    filePath: "src/app.ts",
    threadId: "new-tid"  // New thread overwrites
  })
)
```

## Reference Code

```typescript
// Pattern from application/useCases/CaptureSnapshotsUseCase.ts
export class CaptureSnapshotsUseCase implements ICaptureSnapshotsUseCase {
    constructor(
        private readonly snapshotRepository: ISnapshotRepository,
        private readonly fileSystem: IFileSystemPort,
    ) {}

    async execute(input: CaptureSnapshotsInput): Promise<CaptureSnapshotsResult> {
        // ... implementation
    }
}
```

## Validation

- [ ] Inbound port interface created
- [ ] Use case implementation created
- [ ] Test scenarios TS1, TS2 pass
- [ ] Exported from appropriate index files
- [ ] No vscode imports
- [ ] Type check passes
