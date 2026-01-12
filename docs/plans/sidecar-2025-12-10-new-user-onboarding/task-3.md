# Task 3: Create VscodeWorkspaceStateGateway

**Layer**: Adapters (outbound/gateways)
**Dependencies**: Task 2

## Goal

Implement the IWorkspaceStatePort interface using VSCode's ExtensionContext.workspaceState API.

## Files to Create

- `src/adapters/outbound/gateways/VscodeWorkspaceStateGateway.ts`

## Files to Modify

- `src/adapters/outbound/gateways/index.ts` (add export)

## Implementation

### VscodeWorkspaceStateGateway

```typescript
// src/adapters/outbound/gateways/VscodeWorkspaceStateGateway.ts

import * as vscode from 'vscode';
import { IWorkspaceStatePort } from '../../../application/ports/outbound/IWorkspaceStatePort';

/**
 * Gateway implementation for VSCode workspace state persistence.
 * Wraps ExtensionContext.workspaceState for reading/writing workspace-scoped data.
 */
export class VscodeWorkspaceStateGateway implements IWorkspaceStatePort {
  constructor(private readonly workspaceState: vscode.Memento) {}

  get<T>(key: string): T | undefined {
    return this.workspaceState.get<T>(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.workspaceState.update(key, value);
  }
}
```

### Update Index Export

```typescript
// src/adapters/outbound/gateways/index.ts (add to existing exports)

export { VscodeWorkspaceStateGateway } from './VscodeWorkspaceStateGateway';
```

## Test Scenarios

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| TS-3.1 | Get existing value | workspaceState has 'key' = 'value' | Calling get('key') | Returns 'value' |
| TS-3.2 | Get non-existent key | workspaceState is empty | Calling get('unknown') | Returns undefined |
| TS-3.3 | Set value | Empty workspaceState | Calling set('key', 'value') | workspaceState.update called with key and value |
| TS-3.4 | Type preservation | workspaceState has object value | Calling get<T> with correct type | Returns typed object |

## Acceptance Criteria

- [ ] VscodeWorkspaceStateGateway class exported
- [ ] Implements IWorkspaceStatePort interface
- [ ] Constructor accepts vscode.Memento (workspaceState)
- [ ] get() delegates to workspaceState.get()
- [ ] set() delegates to workspaceState.update() and returns Promise
- [ ] Exported from gateways index
