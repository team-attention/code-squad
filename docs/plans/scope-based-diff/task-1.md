# Task 1: Create Scope Domain Entity

**Layer**: Domain (Entities)
**Dependencies**: None

## Goal

Create domain entities to represent code scopes and scoped diff results.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/domain/entities/Scope.ts` | NEW |
| `src/domain/entities/ScopedDiff.ts` | NEW |
| `src/domain/entities/index.ts` | MODIFY - Export new entities |
| `src/test/domain/entities/Scope.test.ts` | NEW |

## Test Scenarios

### TS-1.1: Scope contains line
**Given**: A Scope with startLine=10, endLine=20
**When**: `containsLine(15)` is called
**Then**: Returns true

### TS-1.2: Scope does not contain line
**Given**: A Scope with startLine=10, endLine=20
**When**: `containsLine(25)` is called
**Then**: Returns false

### TS-1.3: Scope contains range (fully)
**Given**: A Scope with startLine=10, endLine=20
**When**: `containsRange(12, 18)` is called
**Then**: Returns true

### TS-1.4: Scope contains range (partial overlap)
**Given**: A Scope with startLine=10, endLine=20
**When**: `containsRange(15, 25)` is called
**Then**: Returns true (partial overlap counts)

### TS-1.5: Scope full name with container
**Given**: A Scope with name="methodName", containerName="ClassName"
**When**: `fullName` is accessed
**Then**: Returns "ClassName.methodName"

### TS-1.6: Scope full name without container
**Given**: A Scope with name="functionName", containerName=undefined
**When**: `fullName` is accessed
**Then**: Returns "functionName"

### TS-1.7: Nested children
**Given**: A Scope with children array
**When**: Scope is created
**Then**: Children are properly stored as Scope instances

## Implementation

### Scope.ts

```typescript
export interface ScopeData {
    name: string;
    kind: string;
    startLine: number;
    endLine: number;
    containerName?: string;
    children?: ScopeData[];
}

export class Scope {
    readonly name: string;
    readonly kind: string;
    readonly startLine: number;
    readonly endLine: number;
    readonly containerName?: string;
    readonly children: Scope[];

    constructor(data: ScopeData) {
        this.name = data.name;
        this.kind = data.kind;
        this.startLine = data.startLine;
        this.endLine = data.endLine;
        this.containerName = data.containerName;
        this.children = (data.children || []).map(c => new Scope(c));
    }

    containsLine(line: number): boolean {
        return line >= this.startLine && line <= this.endLine;
    }

    containsRange(start: number, end: number): boolean {
        return this.startLine <= end && this.endLine >= start;
    }

    get fullName(): string {
        return this.containerName
            ? `${this.containerName}.${this.name}`
            : this.name;
    }

    get displayName(): string {
        const suffix = this.kind === 'method' || this.kind === 'function' ? '()' : '';
        return `${this.name}${suffix}`;
    }

    toData(): ScopeData {
        return {
            name: this.name,
            kind: this.kind,
            startLine: this.startLine,
            endLine: this.endLine,
            containerName: this.containerName,
            children: this.children.map(c => c.toData()),
        };
    }
}
```

### ScopedDiff.ts

```typescript
import { DiffLine } from './Diff';
import { Scope } from './Scope';

export interface ScopedChunk {
    scope: Scope;
    lines: DiffLine[];
    hasChanges: boolean;
    stats: { additions: number; deletions: number };
    children: ScopedChunk[];
}

export interface ScopedDiffResult {
    file: string;
    root: ScopedChunk[];
    orphanLines: DiffLine[];
    stats: { additions: number; deletions: number };
    hasScopeData: boolean;
}
```

## Validation

```bash
npm run compile
npm run lint
npm run test
```

## Architecture Compliance

- Domain layer: Pure entities, no external dependencies
- No vscode imports
- No application layer imports
- Immutable data structures
