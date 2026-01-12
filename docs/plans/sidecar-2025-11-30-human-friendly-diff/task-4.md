# Task 4: Create LSP Symbol Port

**Requirement**: R2.2
**Layer**: Application (Port), Adapters (Gateway)
**Dependencies**: None

## Goal

Create abstraction for VSCode LSP Document Symbol API to detect scope names (e.g., `ClassName.methodName()`) for collapsed chunks.

## Architecture

```
Application Layer              Adapters Layer
┌─────────────────┐           ┌──────────────────────┐
│   ISymbolPort   │◄──────────│  VscodeLspGateway    │
│   (interface)   │           │  (implementation)     │
└─────────────────┘           └──────────────────────┘
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/application/ports/outbound/ISymbolPort.ts` | CREATE |
| `src/adapters/outbound/gateways/VscodeLspGateway.ts` | CREATE |
| `src/application/ports/outbound/index.ts` | UPDATE (export) |
| `src/adapters/outbound/gateways/index.ts` | UPDATE (export) |
| `src/extension.ts` | UPDATE (wire gateway) |

## Implementation Steps

### Step 1: Create ISymbolPort Interface

```typescript
// src/application/ports/outbound/ISymbolPort.ts

/**
 * Represents a scope containing a line range
 */
export interface ScopeInfo {
    name: string;           // e.g., "getUserById"
    containerName?: string; // e.g., "UserService"
    kind: string;           // e.g., "method", "function", "class"
    startLine: number;
    endLine: number;
}

/**
 * Port for symbol/scope detection via Language Server Protocol
 */
export interface ISymbolPort {
    /**
     * Get the enclosing scope for a specific line
     * @param filePath Absolute file path
     * @param line Line number (1-indexed)
     * @returns ScopeInfo or null if no enclosing scope found
     */
    getEnclosingScope(filePath: string, line: number): Promise<ScopeInfo | null>;

    /**
     * Get all scopes for a range of lines (for pre-fetching)
     * @param filePath Absolute file path
     * @param startLine Start line (1-indexed)
     * @param endLine End line (1-indexed)
     * @returns Array of ScopeInfo that intersect with the range
     */
    getScopesForRange(filePath: string, startLine: number, endLine: number): Promise<ScopeInfo[]>;
}
```

### Step 2: Create VscodeLspGateway

```typescript
// src/adapters/outbound/gateways/VscodeLspGateway.ts

import * as vscode from 'vscode';
import { ISymbolPort, ScopeInfo } from '../../../application/ports/outbound/ISymbolPort';

export class VscodeLspGateway implements ISymbolPort {
    async getEnclosingScope(filePath: string, line: number): Promise<ScopeInfo | null> {
        const uri = vscode.Uri.file(filePath);

        try {
            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                uri
            );

            if (!symbols || symbols.length === 0) {
                return null;
            }

            return this.findEnclosingSymbol(symbols, line);
        } catch (error) {
            console.error('Failed to get document symbols:', error);
            return null;
        }
    }

    async getScopesForRange(filePath: string, startLine: number, endLine: number): Promise<ScopeInfo[]> {
        const uri = vscode.Uri.file(filePath);

        try {
            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                uri
            );

            if (!symbols || symbols.length === 0) {
                return [];
            }

            return this.collectScopesInRange(symbols, startLine, endLine);
        } catch (error) {
            console.error('Failed to get document symbols:', error);
            return [];
        }
    }

    private findEnclosingSymbol(
        symbols: vscode.DocumentSymbol[],
        line: number,
        containerName?: string
    ): ScopeInfo | null {
        for (const symbol of symbols) {
            const startLine = symbol.range.start.line + 1;  // Convert to 1-indexed
            const endLine = symbol.range.end.line + 1;

            if (line >= startLine && line <= endLine) {
                // Check children first for more specific scope
                if (symbol.children && symbol.children.length > 0) {
                    const childScope = this.findEnclosingSymbol(
                        symbol.children,
                        line,
                        symbol.name
                    );
                    if (childScope) {
                        return childScope;
                    }
                }

                // Return this symbol if no child matches
                return {
                    name: symbol.name,
                    containerName,
                    kind: this.symbolKindToString(symbol.kind),
                    startLine,
                    endLine
                };
            }
        }
        return null;
    }

    private collectScopesInRange(
        symbols: vscode.DocumentSymbol[],
        startLine: number,
        endLine: number,
        containerName?: string
    ): ScopeInfo[] {
        const result: ScopeInfo[] = [];

        for (const symbol of symbols) {
            const symStart = symbol.range.start.line + 1;
            const symEnd = symbol.range.end.line + 1;

            // Check if symbol intersects with range
            if (symStart <= endLine && symEnd >= startLine) {
                result.push({
                    name: symbol.name,
                    containerName,
                    kind: this.symbolKindToString(symbol.kind),
                    startLine: symStart,
                    endLine: symEnd
                });

                // Recurse into children
                if (symbol.children && symbol.children.length > 0) {
                    result.push(
                        ...this.collectScopesInRange(
                            symbol.children,
                            startLine,
                            endLine,
                            symbol.name
                        )
                    );
                }
            }
        }

        return result;
    }

    private symbolKindToString(kind: vscode.SymbolKind): string {
        const kindMap: Record<vscode.SymbolKind, string> = {
            [vscode.SymbolKind.File]: 'file',
            [vscode.SymbolKind.Module]: 'module',
            [vscode.SymbolKind.Namespace]: 'namespace',
            [vscode.SymbolKind.Package]: 'package',
            [vscode.SymbolKind.Class]: 'class',
            [vscode.SymbolKind.Method]: 'method',
            [vscode.SymbolKind.Property]: 'property',
            [vscode.SymbolKind.Field]: 'field',
            [vscode.SymbolKind.Constructor]: 'constructor',
            [vscode.SymbolKind.Enum]: 'enum',
            [vscode.SymbolKind.Interface]: 'interface',
            [vscode.SymbolKind.Function]: 'function',
            [vscode.SymbolKind.Variable]: 'variable',
            [vscode.SymbolKind.Constant]: 'constant',
            [vscode.SymbolKind.String]: 'string',
            [vscode.SymbolKind.Number]: 'number',
            [vscode.SymbolKind.Boolean]: 'boolean',
            [vscode.SymbolKind.Array]: 'array',
            [vscode.SymbolKind.Object]: 'object',
            [vscode.SymbolKind.Key]: 'key',
            [vscode.SymbolKind.Null]: 'null',
            [vscode.SymbolKind.EnumMember]: 'enum-member',
            [vscode.SymbolKind.Struct]: 'struct',
            [vscode.SymbolKind.Event]: 'event',
            [vscode.SymbolKind.Operator]: 'operator',
            [vscode.SymbolKind.TypeParameter]: 'type-parameter',
        };
        return kindMap[kind] || 'unknown';
    }
}
```

### Step 3: Update Exports

```typescript
// src/application/ports/outbound/index.ts
export * from './ISymbolPort';

// src/adapters/outbound/gateways/index.ts
export * from './VscodeLspGateway';
```

### Step 4: Wire in extension.ts

```typescript
// src/extension.ts
import { VscodeLspGateway } from './adapters/outbound/gateways/VscodeLspGateway';

// In activate()
const lspGateway = new VscodeLspGateway();
// Pass to panel adapter or state manager as needed
```

## Validation

```bash
npm run compile
# Manual test: Open TypeScript file, verify symbols are detected
```

## Architecture Compliance

- ISymbolPort is in Application layer (ports/outbound) ✓
- No vscode imports in port interface ✓
- VscodeLspGateway is in Adapters layer (outbound/gateways) ✓
- Gateway implements port interface ✓
