# Task 5: Extend ISymbolPort for Full File Symbols

**Layer**: Application (Ports) + Adapter (Gateway)
**Dependencies**: None

## Goal

Extend ISymbolPort interface to support getting all symbols for a file (not just range-based), and implement in VscodeLspGateway.

## Files to Modify

| File | Action |
|------|--------|
| `src/application/ports/outbound/ISymbolPort.ts` | MODIFY - Add method |
| `src/adapters/outbound/gateways/VscodeLspGateway.ts` | MODIFY - Implement |

## Test Scenarios

### TS-5.1: Get all file symbols (success)
**Given**: File with multiple symbols (class, methods, functions)
**When**: `getAllFileSymbols()` is called
**Then**: Returns all symbols with correct structure

**Note**: Integration test requires VSCode environment

### TS-5.2: Get all file symbols (no LSP)
**Given**: File type without LSP support (e.g., plain text)
**When**: `getAllFileSymbols()` is called
**Then**: Returns empty array

### TS-5.3: Nested symbols flattened correctly
**Given**: Class with methods (nested structure)
**When**: `getAllFileSymbols()` is called
**Then**: Returns flat list with containerName set correctly

## Implementation

### ISymbolPort.ts additions

```typescript
export interface ScopeInfo {
    name: string;
    kind: string;
    startLine: number;
    endLine: number;
    containerName?: string;
}

export interface ISymbolPort {
    // ... existing methods

    /**
     * Get all symbols for entire file.
     * Used for building complete scope hierarchy.
     */
    getAllFileSymbols(filePath: string): Promise<ScopeInfo[]>;
}
```

### VscodeLspGateway.ts additions

```typescript
async getAllFileSymbols(filePath: string): Promise<ScopeInfo[]> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return [];

    const fullPath = path.join(workspaceFolder.uri.fsPath, filePath);
    const uri = vscode.Uri.file(fullPath);

    try {
        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            uri
        );

        if (!symbols || symbols.length === 0) {
            return [];
        }

        return this.flattenSymbols(symbols);
    } catch (error) {
        console.error('[Sidecar] Failed to get document symbols:', error);
        return [];
    }
}

private flattenSymbols(
    symbols: vscode.DocumentSymbol[],
    containerName?: string
): ScopeInfo[] {
    const result: ScopeInfo[] = [];

    for (const symbol of symbols) {
        // Filter to relevant symbol kinds
        if (!this.isRelevantSymbolKind(symbol.kind)) {
            continue;
        }

        const scopeInfo: ScopeInfo = {
            name: symbol.name,
            containerName,
            kind: this.symbolKindToString(symbol.kind),
            startLine: symbol.range.start.line + 1,  // 1-indexed
            endLine: symbol.range.end.line + 1,
        };

        result.push(scopeInfo);

        if (symbol.children && symbol.children.length > 0) {
            result.push(...this.flattenSymbols(symbol.children, symbol.name));
        }
    }

    return result;
}

private isRelevantSymbolKind(kind: vscode.SymbolKind): boolean {
    const relevant = [
        vscode.SymbolKind.Class,
        vscode.SymbolKind.Method,
        vscode.SymbolKind.Function,
        vscode.SymbolKind.Constructor,
        vscode.SymbolKind.Interface,
        vscode.SymbolKind.Enum,
        vscode.SymbolKind.Module,
        vscode.SymbolKind.Namespace,
    ];
    return relevant.includes(kind);
}

private symbolKindToString(kind: vscode.SymbolKind): string {
    const map: Record<number, string> = {
        [vscode.SymbolKind.Class]: 'class',
        [vscode.SymbolKind.Method]: 'method',
        [vscode.SymbolKind.Function]: 'function',
        [vscode.SymbolKind.Constructor]: 'constructor',
        [vscode.SymbolKind.Interface]: 'interface',
        [vscode.SymbolKind.Enum]: 'enum',
        [vscode.SymbolKind.Module]: 'module',
        [vscode.SymbolKind.Namespace]: 'namespace',
    };
    return map[kind] || 'unknown';
}
```

## Validation

```bash
npm run compile
npm run lint
```

## Architecture Compliance

- Port defined in application layer (no vscode imports)
- Implementation in adapter layer (uses vscode API)
- ScopeInfo interface is framework-agnostic
