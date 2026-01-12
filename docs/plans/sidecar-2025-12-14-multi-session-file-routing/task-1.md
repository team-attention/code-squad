# Task 1: Create FileThreadMapping Entity

## Goal

Create the domain entity that represents the ownership relationship between files and threads.

## Layer

Domain

## Files

- `src/domain/entities/FileThreadMapping.ts` - Create new entity

## Implementation Steps

1. Create `FileThreadMappingData` interface with:
   - `filePath: string` - Relative path from workspace root
   - `threadId: string` - Thread that last modified this file
   - `lastModifiedAt: number` - Timestamp of last modification

2. Create `FileThreadMapping` class with:
   - Readonly properties matching data interface
   - Private constructor
   - `static create(data: Omit<FileThreadMappingData, 'lastModifiedAt'>): FileThreadMapping`
   - `static fromData(data: FileThreadMappingData): FileThreadMapping`
   - `toData(): FileThreadMappingData`

3. Follow existing entity patterns (reference `Comment.ts`, `Snapshot.ts`)

## Test Scenarios

None - Pure data class with no complex logic.

## Reference Code

```typescript
// Pattern from domain/entities/Snapshot.ts
export interface SnapshotData {
    filePath: string;
    content: string | null;
    capturedAt: number;
}

export class Snapshot {
    readonly filePath: string;
    readonly content: string | null;
    readonly capturedAt: number;

    private constructor(data: SnapshotData) {
        this.filePath = data.filePath;
        this.content = data.content;
        this.capturedAt = data.capturedAt;
    }

    static create(filePath: string, content: string | null): Snapshot {
        return new Snapshot({
            filePath,
            content,
            capturedAt: Date.now(),
        });
    }

    static fromData(data: SnapshotData): Snapshot {
        return new Snapshot(data);
    }

    toData(): SnapshotData {
        return {
            filePath: this.filePath,
            content: this.content,
            capturedAt: this.capturedAt,
        };
    }
}
```

## Validation

- [ ] Entity class created with correct structure
- [ ] Follows existing entity patterns
- [ ] No vscode imports
- [ ] Type check passes
