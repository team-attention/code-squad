# Task 3: Create GenerateScopedDiffUseCase

**Layer**: Application (Use Cases)
**Dependencies**: Task 2

## Goal

Create a use case that orchestrates generating scoped diff by combining diff generation with scope extraction.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/application/ports/inbound/IGenerateScopedDiffUseCase.ts` | NEW |
| `src/application/useCases/GenerateScopedDiffUseCase.ts` | NEW |
| `src/application/useCases/index.ts` | MODIFY - Export |
| `src/application/ports/inbound/index.ts` | MODIFY - Export |
| `src/test/application/useCases/GenerateScopedDiffUseCase.test.ts` | NEW |

## Test Scenarios

### TS-3.1: Generate scoped diff with symbols
**Given**:
- File has diff
- LSP returns document symbols

**When**: `execute()` is called
**Then**: Returns ScopedDiffResult with mapped scopes

**Mock**:
- `ISymbolPort.getAllFileSymbols()` returns symbols
- `IGenerateDiffUseCase.execute()` returns diff

### TS-3.2: Fallback when no symbols
**Given**:
- File has diff
- LSP returns empty symbols

**When**: `execute()` is called
**Then**: Returns ScopedDiffResult with hasScopeData=false

**Mock**:
- `ISymbolPort.getAllFileSymbols()` returns []
- `IGenerateDiffUseCase.execute()` returns diff

### TS-3.3: Return null when no diff
**Given**: File has no changes
**When**: `execute()` is called
**Then**: Returns null

**Mock**: `IGenerateDiffUseCase.execute()` returns null

### TS-3.4: Handle LSP error gracefully
**Given**:
- File has diff
- LSP throws error

**When**: `execute()` is called
**Then**: Returns ScopedDiffResult with hasScopeData=false (fallback)

**Mock**: `ISymbolPort.getAllFileSymbols()` throws

## Implementation

### IGenerateScopedDiffUseCase.ts

```typescript
import { ScopedDiffResult } from '../../../domain/entities/ScopedDiff';

export interface IGenerateScopedDiffUseCase {
    execute(relativePath: string): Promise<ScopedDiffResult | null>;
}
```

### GenerateScopedDiffUseCase.ts

```typescript
import { IGenerateScopedDiffUseCase } from '../ports/inbound/IGenerateScopedDiffUseCase';
import { IGenerateDiffUseCase } from '../ports/inbound/IGenerateDiffUseCase';
import { ISymbolPort } from '../ports/outbound/ISymbolPort';
import { ScopeMappingService } from '../../domain/services/ScopeMappingService';
import { ScopedDiffResult } from '../../domain/entities/ScopedDiff';

export class GenerateScopedDiffUseCase implements IGenerateScopedDiffUseCase {
    constructor(
        private readonly generateDiffUseCase: IGenerateDiffUseCase,
        private readonly symbolPort: ISymbolPort,
        private readonly scopeMappingService: ScopeMappingService
    ) {}

    async execute(relativePath: string): Promise<ScopedDiffResult | null> {
        const diff = await this.generateDiffUseCase.execute(relativePath);
        if (!diff) {
            return null;
        }

        let scopes: ScopeInfo[] = [];
        try {
            scopes = await this.symbolPort.getAllFileSymbols(relativePath);
        } catch (error) {
            // LSP failed, will fall back to chunk-based view
            console.warn('[Sidecar] Symbol extraction failed:', error);
        }

        return this.scopeMappingService.mapDiffToScopes(diff, scopes);
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

- Application layer: Orchestrates domain and ports
- No vscode imports
- Depends on domain entities and services
- Uses ports for external dependencies (ISymbolPort, IGenerateDiffUseCase)
