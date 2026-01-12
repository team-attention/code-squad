# Task 6: Integrate Scoped Diff in SidecarPanelAdapter

**Layer**: Adapter (UI)
**Dependencies**: Tasks 3, 4, 5

## Goal

Integrate scoped diff generation into SidecarPanelAdapter, replacing or augmenting the current diff display logic when scope data is available.

## Files to Modify

| File | Action |
|------|--------|
| `src/adapters/inbound/ui/SidecarPanelAdapter.ts` | MODIFY - Add integration |
| `src/extension.ts` | MODIFY - Wire GenerateScopedDiffUseCase |

## Implementation

### SidecarPanelAdapter.ts modifications

```typescript
// Add to dependencies
private generateScopedDiffUseCase: IGenerateScopedDiffUseCase | undefined;

// Add to setUseCases
setUseCases(
    // ... existing
    generateScopedDiffUseCase?: IGenerateScopedDiffUseCase,
): void {
    // ... existing
    this.generateScopedDiffUseCase = generateScopedDiffUseCase;
}

// Modify handleSelectFile to try scoped diff first
private async handleSelectFile(file: string): Promise<void> {
    if (!file || !this.generateDiffUseCase || !this.panelStateManager) return;

    // Try scoped diff first
    if (this.generateScopedDiffUseCase) {
        try {
            const scopedResult = await this.generateScopedDiffUseCase.execute(file);

            if (scopedResult && scopedResult.hasScopeData) {
                const displayState = this.createScopedDiffDisplayState(scopedResult);
                this.panelStateManager.showScopedDiff(displayState);
                return;
            }
        } catch (error) {
            console.warn('[Sidecar] Scoped diff failed, falling back:', error);
        }
    }

    // Fallback to regular diff
    const diffResult = await this.generateDiffUseCase.execute(file);
    if (diffResult) {
        this.panelStateManager.showDiff(file, diffResult);
    }
}

// Add helper to create display state
private createScopedDiffDisplayState(result: ScopedDiffResult): ScopedDiffDisplayState {
    const scopes = this.convertToDisplayScopes(result.root, 0);

    return {
        file: result.file,
        scopes,
        orphanLines: result.orphanLines.map(this.convertToDiffLineDisplay),
        stats: result.stats,
        hasScopeData: result.hasScopeData,
    };
}

private convertToDisplayScopes(
    chunks: ScopedChunk[],
    depth: number
): ScopedChunkDisplay[] {
    return chunks.map((chunk, index) => {
        const scopeId = `${chunk.scope.fullName}-${chunk.scope.startLine}`;

        return {
            scopeId,
            scopeName: chunk.scope.displayName,
            scopeKind: chunk.scope.kind,
            fullName: chunk.scope.fullName,
            hasChanges: chunk.hasChanges,
            isCollapsed: !chunk.hasChanges,  // Default: collapsed if no changes
            lines: chunk.lines.map(this.convertToDiffLineDisplay),
            stats: chunk.stats,
            children: this.convertToDisplayScopes(chunk.children, depth + 1),
            depth,
        };
    });
}

// Add message handlers for scope collapse
private handleMessage(message: WebviewMessage): void {
    switch (message.type) {
        // ... existing cases

        case 'toggleScopeCollapse':
            this.panelStateManager?.toggleScopeCollapse(message.scopeId);
            break;

        case 'expandAllScopes':
            this.panelStateManager?.expandAllScopes();
            break;

        case 'collapseAllScopes':
            this.panelStateManager?.collapseAllScopes();
            break;

        case 'expandScopeForLine':
            this.handleExpandScopeForLine(message.line);
            break;
    }
}

private handleExpandScopeForLine(line: number): void {
    if (!this.panelStateManager?.getState().scopedDiff) return;

    const scopeId = this.findScopeIdForLine(
        line,
        this.panelStateManager.getState().scopedDiff!.scopes
    );

    if (scopeId) {
        this.panelStateManager.expandScopeChain(scopeId);
    }
}

private findScopeIdForLine(
    line: number,
    scopes: ScopedChunkDisplay[]
): string | null {
    for (const scope of scopes) {
        // Check if line is in this scope's lines
        const hasLine = scope.lines.some(l => l.lineNumber === line);
        if (hasLine) {
            // Check children first for innermost scope
            const childId = this.findScopeIdForLine(line, scope.children);
            return childId || scope.scopeId;
        }
    }
    return null;
}
```

### extension.ts modifications

```typescript
// Add imports
import { GenerateScopedDiffUseCase } from './application/useCases/GenerateScopedDiffUseCase';
import { ScopeMappingService } from './domain/services/ScopeMappingService';

// In activate function, create and wire use case
const scopeMappingService = new ScopeMappingService();
const generateScopedDiffUseCase = new GenerateScopedDiffUseCase(
    generateDiffUseCase,
    symbolPort,
    scopeMappingService
);

// Pass to panel adapter
sidecarPanelAdapter.setUseCases(
    // ... existing
    generateScopedDiffUseCase,
);
```

## Validation

```bash
npm run compile
npm run lint
```

## Architecture Compliance

- Adapter layer: VSCode integration
- Calls application layer use cases
- Updates state via PanelStateManager
- No direct DOM manipulation (handled by webview)
