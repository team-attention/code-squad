# Task 1: Rename DiffHunk to DiffChunk

**Requirement**: R1.2
**Layer**: Domain
**Dependencies**: None

## Goal

Rename `DiffHunk` to `DiffChunk` throughout the codebase for user-friendly terminology.

## Files to Modify

| File | Changes |
|------|---------|
| `src/domain/entities/Diff.ts` | Rename interface `DiffHunk` → `DiffChunk` |
| `src/domain/services/DiffService.ts` | Update type references and variable names |
| `src/adapters/inbound/ui/SidecarPanelAdapter.ts` | Update UI rendering function names |

## Implementation Steps

### Step 1: Update Domain Entity (`src/domain/entities/Diff.ts`)

```typescript
// BEFORE
export interface DiffHunk {
    header: string;
    oldStart: number;
    newStart: number;
    lines: DiffLine[];
}

export interface DiffResult {
    file: string;
    hunks: DiffHunk[];
    stats: { additions: number; deletions: number; };
}

// AFTER
export interface DiffChunk {
    header: string;
    oldStart: number;
    newStart: number;
    lines: DiffLine[];
}

export interface DiffResult {
    file: string;
    chunks: DiffChunk[];  // renamed from hunks
    stats: { additions: number; deletions: number; };
}
```

### Step 2: Update DiffService (`src/domain/services/DiffService.ts`)

- Change import: `DiffHunk` → `DiffChunk`
- Rename variable: `hunks` → `chunks`
- Rename variable: `currentHunk` → `currentChunk`

### Step 3: Update UI Rendering (`src/adapters/inbound/ui/SidecarPanelAdapter.ts`)

- Rename function: `renderHunksToHtml` → `renderChunksToHtml`
- Update references in `renderDiff` function

## Validation

```bash
npm run compile  # No errors
grep -r "DiffHunk\|hunks" src/  # Should return no matches
```

## Architecture Compliance

- Domain layer: Pure TypeScript, no vscode imports ✓
- Naming follows conventions: PascalCase for types ✓
