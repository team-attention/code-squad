# Task 4: Extend PanelState for Scoped Diff

**Layer**: Application (State)
**Dependencies**: None

## Goal

Extend PanelState and PanelStateManager to support scoped diff display state, including per-scope collapse states.

## Files to Modify

| File | Action |
|------|--------|
| `src/application/ports/outbound/PanelState.ts` | MODIFY - Add types |
| `src/application/services/PanelStateManager.ts` | MODIFY - Add methods |
| `src/application/services/IPanelStateManager.ts` | MODIFY - Add interface |

## Test Scenarios

### TS-4.1: Set scoped diff display state
**Given**: Initial panel state
**When**: `showScopedDiff()` is called with ScopedDiffDisplayState
**Then**: State contains scoped diff, render callback invoked

### TS-4.2: Toggle scope collapse (unchanged scope)
**Given**: Scoped diff with unchanged scope
**When**: `toggleScopeCollapse(scopeId)` is called
**Then**: Scope collapse state toggles

### TS-4.3: Cannot collapse changed scope
**Given**: Scoped diff with scope that has changes
**When**: `toggleScopeCollapse(scopeId)` is called
**Then**: Scope remains expanded (no state change)

### TS-4.4: Expand all scopes
**Given**: Some scopes are collapsed
**When**: `expandAllScopes()` is called
**Then**: All scopes are expanded

### TS-4.5: Collapse all (respecting changed scopes)
**Given**: Mixed changed/unchanged scopes
**When**: `collapseAllScopes()` is called
**Then**: Only unchanged scopes are collapsed

### TS-4.6: Reset collapse state on file switch
**Given**: Scoped diff with custom collapse states
**When**: Different file is selected
**Then**: Collapse states reset to defaults

## Implementation

### PanelState.ts additions

```typescript
export interface ScopedChunkDisplay {
    scopeId: string;
    scopeName: string;
    scopeKind: string;
    fullName: string;
    hasChanges: boolean;
    isCollapsed: boolean;
    lines: DiffLineDisplay[];
    stats: { additions: number; deletions: number };
    children: ScopedChunkDisplay[];
    depth: number;
}

export interface ScopedDiffDisplayState {
    file: string;
    scopes: ScopedChunkDisplay[];
    orphanLines: DiffLineDisplay[];
    stats: { additions: number; deletions: number };
    hasScopeData: boolean;
}

export interface PanelState {
    // ... existing fields
    scopedDiff: ScopedDiffDisplayState | null;
}
```

### PanelStateManager.ts additions

```typescript
showScopedDiff(scopedDiff: ScopedDiffDisplayState): void {
    this.state = {
        ...this.state,
        scopedDiff,
        diff: null,  // Clear regular diff
        selectedFile: scopedDiff.file,
    };
    this.render();
}

toggleScopeCollapse(scopeId: string): void {
    if (!this.state.scopedDiff) return;

    const scope = this.findScopeById(scopeId, this.state.scopedDiff.scopes);
    if (!scope || scope.hasChanges) return;

    const newScopes = this.updateScopeCollapse(
        this.state.scopedDiff.scopes,
        scopeId,
        !scope.isCollapsed
    );

    this.state = {
        ...this.state,
        scopedDiff: { ...this.state.scopedDiff, scopes: newScopes },
    };
    this.render();
}

expandAllScopes(): void {
    if (!this.state.scopedDiff) return;

    const newScopes = this.setAllCollapseStates(
        this.state.scopedDiff.scopes,
        false
    );

    this.state = {
        ...this.state,
        scopedDiff: { ...this.state.scopedDiff, scopes: newScopes },
    };
    this.render();
}

collapseAllScopes(): void {
    if (!this.state.scopedDiff) return;

    const newScopes = this.setAllCollapseStates(
        this.state.scopedDiff.scopes,
        true,
        (scope) => !scope.hasChanges  // Only collapse if no changes
    );

    this.state = {
        ...this.state,
        scopedDiff: { ...this.state.scopedDiff, scopes: newScopes },
    };
    this.render();
}

expandScopeChain(scopeId: string): void {
    // Expand scope and all parent scopes (for comment navigation)
    if (!this.state.scopedDiff) return;

    const chain = this.findScopeChain(scopeId, this.state.scopedDiff.scopes);
    let newScopes = this.state.scopedDiff.scopes;

    for (const id of chain) {
        newScopes = this.updateScopeCollapse(newScopes, id, false);
    }

    this.state = {
        ...this.state,
        scopedDiff: { ...this.state.scopedDiff, scopes: newScopes },
    };
    this.render();
}

private findScopeById(
    scopeId: string,
    scopes: ScopedChunkDisplay[]
): ScopedChunkDisplay | null {
    for (const scope of scopes) {
        if (scope.scopeId === scopeId) return scope;
        const found = this.findScopeById(scopeId, scope.children);
        if (found) return found;
    }
    return null;
}

private updateScopeCollapse(
    scopes: ScopedChunkDisplay[],
    scopeId: string,
    isCollapsed: boolean
): ScopedChunkDisplay[] {
    return scopes.map(scope => {
        if (scope.scopeId === scopeId) {
            return { ...scope, isCollapsed };
        }
        return {
            ...scope,
            children: this.updateScopeCollapse(scope.children, scopeId, isCollapsed)
        };
    });
}

private setAllCollapseStates(
    scopes: ScopedChunkDisplay[],
    collapsed: boolean,
    predicate?: (scope: ScopedChunkDisplay) => boolean
): ScopedChunkDisplay[] {
    return scopes.map(scope => ({
        ...scope,
        isCollapsed: predicate ? (predicate(scope) ? collapsed : scope.isCollapsed) : collapsed,
        children: this.setAllCollapseStates(scope.children, collapsed, predicate)
    }));
}
```

## Validation

```bash
npm run compile
npm run lint
```

## Architecture Compliance

- Application layer: State management
- No vscode imports
- Pure state transitions
