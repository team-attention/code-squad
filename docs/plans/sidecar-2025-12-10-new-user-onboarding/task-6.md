# Task 6: Create Use Cases

**Layer**: Application (useCases)
**Dependencies**: Task 2, Task 4

## Goal

Create ShowOnboardingWalkthroughUseCase and ResetOnboardingUseCase to manage onboarding lifecycle.

## Files to Create

- `src/application/ports/inbound/IShowOnboardingUseCase.ts`
- `src/application/ports/inbound/IResetOnboardingUseCase.ts`
- `src/application/useCases/ShowOnboardingWalkthroughUseCase.ts`
- `src/application/useCases/ResetOnboardingUseCase.ts`

## Files to Modify

- `src/application/ports/inbound/index.ts` (add exports)
- `src/application/useCases/index.ts` (add exports)

## Implementation

### IShowOnboardingUseCase Interface

```typescript
// src/application/ports/inbound/IShowOnboardingUseCase.ts

export interface IShowOnboardingUseCase {
  /**
   * Check if onboarding should be shown and start it if needed.
   * @returns true if onboarding was started, false if already completed
   */
  execute(): Promise<boolean>;

  /**
   * Mark onboarding as completed in workspace state.
   */
  completeOnboarding(): Promise<void>;
}
```

### IResetOnboardingUseCase Interface

```typescript
// src/application/ports/inbound/IResetOnboardingUseCase.ts

export interface IResetOnboardingUseCase {
  /**
   * Clear the onboarding completion flag.
   * Next AI session will trigger onboarding walkthrough.
   */
  execute(): Promise<void>;
}
```

### ShowOnboardingWalkthroughUseCase

```typescript
// src/application/useCases/ShowOnboardingWalkthroughUseCase.ts

import { IShowOnboardingUseCase } from '../ports/inbound/IShowOnboardingUseCase';
import { IWorkspaceStatePort, WORKSPACE_STATE_KEYS, OnboardingCompletionData } from '../ports/outbound/IWorkspaceStatePort';
import { IPanelStateManager } from '../services/IPanelStateManager';
import { TOTAL_ONBOARDING_STEPS } from '../../domain/entities/OnboardingStep';

export class ShowOnboardingWalkthroughUseCase implements IShowOnboardingUseCase {
  constructor(
    private readonly workspaceStatePort: IWorkspaceStatePort,
    private readonly panelStateManager: IPanelStateManager,
  ) {}

  async execute(): Promise<boolean> {
    const data = this.workspaceStatePort.get<OnboardingCompletionData>(
      WORKSPACE_STATE_KEYS.ONBOARDING_COMPLETED
    );

    if (data?.completed) {
      return false;
    }

    this.panelStateManager.startOnboarding(TOTAL_ONBOARDING_STEPS);
    return true;
  }

  async completeOnboarding(): Promise<void> {
    const data: OnboardingCompletionData = {
      completed: true,
      timestamp: new Date().toISOString(),
    };
    await this.workspaceStatePort.set(WORKSPACE_STATE_KEYS.ONBOARDING_COMPLETED, data);
  }
}
```

### ResetOnboardingUseCase

```typescript
// src/application/useCases/ResetOnboardingUseCase.ts

import { IResetOnboardingUseCase } from '../ports/inbound/IResetOnboardingUseCase';
import { IWorkspaceStatePort, WORKSPACE_STATE_KEYS, OnboardingCompletionData } from '../ports/outbound/IWorkspaceStatePort';

export class ResetOnboardingUseCase implements IResetOnboardingUseCase {
  constructor(
    private readonly workspaceStatePort: IWorkspaceStatePort,
  ) {}

  async execute(): Promise<void> {
    const data: OnboardingCompletionData = {
      completed: false,
      timestamp: new Date().toISOString(),
    };
    await this.workspaceStatePort.set(WORKSPACE_STATE_KEYS.ONBOARDING_COMPLETED, data);
  }
}
```

## Test Scenarios

### ShowOnboardingWalkthroughUseCase

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| TS-6.1 | First time user | onboardingCompleted is undefined | execute() | Returns true, startOnboarding called |
| TS-6.2 | Completed before | onboardingCompleted.completed=true | execute() | Returns false, startOnboarding not called |
| TS-6.3 | Reset previously | onboardingCompleted.completed=false | execute() | Returns true, startOnboarding called |
| TS-6.4 | Complete onboarding | Any state | completeOnboarding() | workspaceState set with completed=true |

### ResetOnboardingUseCase

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| TS-6.5 | Reset when completed | onboardingCompleted.completed=true | execute() | workspaceState set with completed=false |
| TS-6.6 | Reset when not completed | onboardingCompleted is undefined | execute() | workspaceState set with completed=false |

## Acceptance Criteria

- [ ] IShowOnboardingUseCase interface exported
- [ ] IResetOnboardingUseCase interface exported
- [ ] ShowOnboardingWalkthroughUseCase implements IShowOnboardingUseCase
- [ ] ResetOnboardingUseCase implements IResetOnboardingUseCase
- [ ] execute() checks workspace state before starting onboarding
- [ ] completeOnboarding() persists completion with timestamp
- [ ] Reset clears the completion flag
- [ ] All use cases exported from useCases/index.ts
- [ ] Interfaces exported from ports/inbound/index.ts
- [ ] No vscode imports in application layer
