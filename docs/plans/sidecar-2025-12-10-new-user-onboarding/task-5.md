# Task 5: Add Onboarding Methods to IPanelStateManager

**Layer**: Application (services)
**Dependencies**: Task 4

## Goal

Extend IPanelStateManager interface and PanelStateManager implementation with methods for managing onboarding state.

## Files to Modify

- `src/application/services/IPanelStateManager.ts`
- `src/application/services/PanelStateManager.ts`

## Implementation

### Extend IPanelStateManager Interface

Add to IPanelStateManager.ts:

```typescript
export interface IPanelStateManager {
  // ... existing methods ...

  /**
   * Start onboarding walkthrough.
   * Sets onboarding state to active with step 0.
   * @param totalSteps Total number of walkthrough steps
   */
  startOnboarding(totalSteps: number): void;

  /**
   * Advance to next onboarding step.
   * Does nothing if already on last step.
   */
  nextOnboardingStep(): void;

  /**
   * Go back to previous onboarding step.
   * Does nothing if already on first step.
   */
  previousOnboardingStep(): void;

  /**
   * End onboarding walkthrough.
   * Sets onboarding state to null.
   */
  endOnboarding(): void;
}
```

### Implement in PanelStateManager

Add to PanelStateManager.ts:

```typescript
startOnboarding(totalSteps: number): void {
  this.state = {
    ...this.state,
    onboarding: {
      active: true,
      currentStep: 0,
      totalSteps,
    },
  };
  this.notifyStateChange();
}

nextOnboardingStep(): void {
  if (!this.state.onboarding) return;

  const { currentStep, totalSteps } = this.state.onboarding;
  if (currentStep >= totalSteps - 1) return;

  this.state = {
    ...this.state,
    onboarding: {
      ...this.state.onboarding,
      currentStep: currentStep + 1,
    },
  };
  this.notifyStateChange();
}

previousOnboardingStep(): void {
  if (!this.state.onboarding) return;

  const { currentStep } = this.state.onboarding;
  if (currentStep <= 0) return;

  this.state = {
    ...this.state,
    onboarding: {
      ...this.state.onboarding,
      currentStep: currentStep - 1,
    },
  };
  this.notifyStateChange();
}

endOnboarding(): void {
  this.state = {
    ...this.state,
    onboarding: null,
  };
  this.notifyStateChange();
}
```

## Test Scenarios

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| TS-5.1 | Start onboarding | onboarding is null | startOnboarding(7) | onboarding.active=true, currentStep=0, totalSteps=7 |
| TS-5.2 | Next step normal | currentStep=2, totalSteps=7 | nextOnboardingStep() | currentStep=3 |
| TS-5.3 | Next step at end | currentStep=6, totalSteps=7 | nextOnboardingStep() | currentStep remains 6 |
| TS-5.4 | Previous step normal | currentStep=2 | previousOnboardingStep() | currentStep=1 |
| TS-5.5 | Previous step at start | currentStep=0 | previousOnboardingStep() | currentStep remains 0 |
| TS-5.6 | End onboarding | onboarding is active | endOnboarding() | onboarding is null |
| TS-5.7 | State change notification | Any onboarding method | Method called | notifyStateChange() triggered |
| TS-5.8 | Methods when inactive | onboarding is null | next/previousOnboardingStep() | No error, no state change |

## Acceptance Criteria

- [ ] IPanelStateManager interface has startOnboarding, nextOnboardingStep, previousOnboardingStep, endOnboarding methods
- [ ] PanelStateManager implements all new methods
- [ ] startOnboarding sets active=true, currentStep=0
- [ ] nextOnboardingStep increments currentStep (capped at totalSteps-1)
- [ ] previousOnboardingStep decrements currentStep (minimum 0)
- [ ] endOnboarding sets onboarding to null
- [ ] All methods call notifyStateChange()
- [ ] Methods handle null onboarding state gracefully
- [ ] No vscode imports in application layer
