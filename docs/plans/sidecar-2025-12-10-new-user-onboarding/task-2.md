# Task 2: Create IWorkspaceStatePort Interface

**Layer**: Application (ports/outbound)
**Dependencies**: None

## Goal

Define an outbound port interface for reading and writing VSCode workspace state, enabling persistence of onboarding completion status.

## Files to Create

- `src/application/ports/outbound/IWorkspaceStatePort.ts`

## Implementation

### IWorkspaceStatePort Interface

```typescript
// src/application/ports/outbound/IWorkspaceStatePort.ts

/**
 * Port for accessing VSCode workspace state (persistent storage per workspace).
 * Used for storing onboarding completion status and other workspace-scoped preferences.
 */
export interface IWorkspaceStatePort {
  /**
   * Get a value from workspace state.
   * @param key The storage key
   * @returns The stored value or undefined if not found
   */
  get<T>(key: string): T | undefined;

  /**
   * Set a value in workspace state.
   * @param key The storage key
   * @param value The value to store
   */
  set<T>(key: string, value: T): Promise<void>;
}

/**
 * Storage key constants for workspace state.
 */
export const WORKSPACE_STATE_KEYS = {
  ONBOARDING_COMPLETED: 'sidecar.onboardingCompleted',
} as const;

/**
 * Type for onboarding completion data stored in workspace state.
 */
export interface OnboardingCompletionData {
  completed: boolean;
  timestamp: string;  // ISO 8601 format
}
```

## Test Scenarios

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| TS-2.1 | Interface structure | IWorkspaceStatePort | Checking methods | Has get<T> and set<T> methods |
| TS-2.2 | Key constants | WORKSPACE_STATE_KEYS | Accessing ONBOARDING_COMPLETED | Returns 'sidecar.onboardingCompleted' |
| TS-2.3 | Completion data type | OnboardingCompletionData | Type checking | Has completed (boolean) and timestamp (string) fields |

## Acceptance Criteria

- [ ] IWorkspaceStatePort interface exported
- [ ] get<T>(key: string) method defined with correct return type
- [ ] set<T>(key: string, value: T) method defined as async
- [ ] WORKSPACE_STATE_KEYS constant exported
- [ ] OnboardingCompletionData interface exported
- [ ] No vscode imports in application layer
