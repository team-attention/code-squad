# Task 3: Add Per-Chunk Statistics

**Requirement**: R2.3
**Layer**: Domain
**Dependencies**: Task 1 (Rename DiffHunk to DiffChunk)

## Goal

Add `[+N, -M]` statistics to each chunk for display when collapsed.

## Files to Modify

| File | Changes |
|------|---------|
| `src/domain/entities/Diff.ts` | Add stats to `DiffChunk` interface |
| `src/domain/services/DiffService.ts` | Calculate per-chunk stats during parsing |

## Implementation Steps

### Step 1: Update DiffChunk Interface

```typescript
// src/domain/entities/Diff.ts

export interface DiffChunk {
    header: string;
    oldStart: number;
    newStart: number;
    lines: DiffLine[];
    stats: {  // NEW
        additions: number;
        deletions: number;
    };
}
```

### Step 2: Calculate Stats in DiffService

```typescript
// src/domain/services/DiffService.ts

// In parseUnifiedDiff method, track per-chunk stats
parseUnifiedDiff(file: string, diffText: string): DiffResult {
    // ...existing code...

    let currentChunk: DiffChunk | null = null;
    let chunkAdditions = 0;  // NEW
    let chunkDeletions = 0;  // NEW

    for (const line of lines) {
        // ... skip metadata ...

        // Chunk header
        if (line.startsWith('@@')) {
            if (currentChunk) {
                // Save stats before pushing
                currentChunk.stats = {
                    additions: chunkAdditions,
                    deletions: chunkDeletions
                };
                chunks.push(currentChunk);
            }
            // Reset per-chunk counters
            chunkAdditions = 0;
            chunkDeletions = 0;

            const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@(.*)/);
            if (match) {
                currentChunk = {
                    header: line,
                    oldStart: parseInt(match[1], 10),
                    newStart: parseInt(match[2], 10),
                    lines: [],
                    stats: { additions: 0, deletions: 0 }  // Will be updated
                };
            }
            continue;
        }

        // ... existing line processing ...

        if (line.startsWith('+')) {
            // ... existing code ...
            additions++;
            chunkAdditions++;  // NEW
        } else if (line.startsWith('-')) {
            // ... existing code ...
            deletions++;
            chunkDeletions++;  // NEW
        }
        // ...
    }

    // Don't forget the last chunk
    if (currentChunk) {
        currentChunk.stats = {
            additions: chunkAdditions,
            deletions: chunkDeletions
        };
        chunks.push(currentChunk);
    }

    return { file, chunks, stats: { additions, deletions } };
}
```

## Validation

```bash
npm run compile
npm run test  # Ensure DiffService tests pass
```

## Test Case

```typescript
// Input diff
const diff = `@@ -1,3 +1,4 @@
 context
+added line
 context
@@ -10,2 +11,3 @@
-deleted
+new line 1
+new line 2`;

// Expected output
// chunk[0].stats = { additions: 1, deletions: 0 }
// chunk[1].stats = { additions: 2, deletions: 1 }
```

## Architecture Compliance

- Domain layer: Pure TypeScript, no external dependencies ✓
- DiffService remains stateless pure function ✓
