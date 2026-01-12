# Task 2: Create ScopeMappingService

**Layer**: Domain (Services)
**Dependencies**: Task 1

## Goal

Create a domain service that maps diff hunks to their containing scopes, building a hierarchical scoped diff structure.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/domain/services/ScopeMappingService.ts` | NEW |
| `src/domain/services/index.ts` | MODIFY - Export |
| `src/test/domain/services/ScopeMappingService.test.ts` | NEW |

## Test Scenarios

### TS-2.1: Map single change to single scope
**Given**:
- DiffResult with one hunk at lines 15-18
- One scope (function) at lines 10-25

**When**: `mapDiffToScopes()` is called
**Then**: Returns ScopedDiffResult with one ScopedChunk containing the hunk

### TS-2.2: Map change to nested scope
**Given**:
- DiffResult with one hunk at lines 15-18
- Outer scope (class) at lines 1-50
- Inner scope (method) at lines 10-25

**When**: `mapDiffToScopes()` is called
**Then**: Returns ScopedDiffResult with nested structure, change in innermost scope

### TS-2.3: Multiple changes in different scopes
**Given**:
- DiffResult with hunks at lines 15-18 and 40-42
- Scope A at lines 10-25
- Scope B at lines 35-50

**When**: `mapDiffToScopes()` is called
**Then**: Returns ScopedDiffResult with two separate scoped chunks

### TS-2.4: Orphan lines (no scope)
**Given**:
- DiffResult with hunk at lines 5-8
- Only scope at lines 20-50

**When**: `mapDiffToScopes()` is called
**Then**: Returns ScopedDiffResult with orphanLines containing the hunk

### TS-2.5: Empty scopes (no diff)
**Given**:
- Scopes exist
- No diff hunks

**When**: `mapDiffToScopes()` is called
**Then**: Returns ScopedDiffResult with scopes but hasChanges=false for all

### TS-2.6: No scopes available
**Given**:
- DiffResult with hunks
- Empty scopes array

**When**: `mapDiffToScopes()` is called
**Then**: Returns ScopedDiffResult with hasScopeData=false

### TS-2.7: Calculate scope statistics
**Given**: Scope containing additions and deletions
**When**: `mapDiffToScopes()` is called
**Then**: Each ScopedChunk has correct stats.additions and stats.deletions

### TS-2.8: Build scope tree from flat list
**Given**: Flat list of scopes with container relationships
**When**: `buildScopeTree()` is called
**Then**: Returns hierarchical Scope[] with proper nesting

## Implementation

```typescript
import { DiffResult, DiffLine, DiffChunk } from '../entities/Diff';
import { Scope, ScopeData } from '../entities/Scope';
import { ScopedDiffResult, ScopedChunk } from '../entities/ScopedDiff';

export interface ScopeInfo {
    name: string;
    kind: string;
    startLine: number;
    endLine: number;
    containerName?: string;
}

export class ScopeMappingService {
    mapDiffToScopes(diff: DiffResult, scopes: ScopeInfo[]): ScopedDiffResult {
        if (scopes.length === 0) {
            return {
                file: diff.file,
                root: [],
                orphanLines: this.collectAllLines(diff),
                stats: diff.stats,
                hasScopeData: false,
            };
        }

        const scopeTree = this.buildScopeTree(scopes);
        const { scopedChunks, orphanLines } = this.mapLinesToScopes(diff, scopeTree);

        return {
            file: diff.file,
            root: scopedChunks,
            orphanLines,
            stats: diff.stats,
            hasScopeData: true,
        };
    }

    buildScopeTree(scopes: ScopeInfo[]): Scope[] {
        const sorted = [...scopes].sort((a, b) => {
            if (a.startLine !== b.startLine) {
                return a.startLine - b.startLine;
            }
            return (b.endLine - b.startLine) - (a.endLine - a.startLine);
        });

        const result: Scope[] = [];
        const stack: { scope: Scope; endLine: number }[] = [];

        for (const info of sorted) {
            while (stack.length > 0 && stack[stack.length - 1].endLine < info.startLine) {
                stack.pop();
            }

            const scopeData: ScopeData = {
                name: info.name,
                kind: info.kind,
                startLine: info.startLine,
                endLine: info.endLine,
                containerName: info.containerName,
                children: [],
            };

            const scope = new Scope(scopeData);

            if (stack.length > 0) {
                (stack[stack.length - 1].scope.children as Scope[]).push(scope);
            } else {
                result.push(scope);
            }

            if (info.endLine > info.startLine) {
                stack.push({ scope, endLine: info.endLine });
            }
        }

        return result;
    }

    private mapLinesToScopes(
        diff: DiffResult,
        scopes: Scope[]
    ): { scopedChunks: ScopedChunk[]; orphanLines: DiffLine[] } {
        // Implementation: iterate diff lines, find containing scope, group by scope
        // ...
    }

    private collectAllLines(diff: DiffResult): DiffLine[] {
        return diff.chunks.flatMap(chunk => chunk.lines);
    }

    private findInnermostScope(line: number, scopes: Scope[]): Scope | null {
        for (const scope of scopes) {
            if (scope.containsLine(line)) {
                const nested = this.findInnermostScope(line, scope.children);
                return nested || scope;
            }
        }
        return null;
    }
}
```

## Validation

```bash
npm run compile
npm run lint
npm run test
```

## Architecture Compliance

- Domain layer: Pure business logic
- No vscode imports
- Uses ScopeInfo interface (will be defined in application/ports)
- All pure functions, easily testable
