# Task 4: Add Onboarding State to PanelState

**Layer**: Application (ports/outbound)
**Dependencies**: None

## Goal

Extend the existing PanelState interface to include onboarding state for tracking walkthrough progress.

## Files to Modify

- `src/application/ports/outbound/PanelState.ts`

## Implementation

### OnboardingState Interface

Add to PanelState.ts:

```typescript
/**
 * State for onboarding walkthrough.
 */
export interface OnboardingState {
  /** Whether onboarding overlay is currently displayed */
  active: boolean;
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
}
```

### Extend PanelState

Add to the existing PanelState interface:

```typescript
export interface PanelState {
  // ... existing fields ...

  /** Onboarding walkthrough state, null when not active */
  onboarding: OnboardingState | null;
}
```

### Update createInitialPanelState

Modify the createInitialPanelState function to include onboarding:

```typescript
export function createInitialPanelState(): PanelState {
  return {
    // ... existing fields ...
    onboarding: null,
  };
}
```

## Test Scenarios

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| TS-4.1 | OnboardingState interface | OnboardingState type | Type checking | Has active, currentStep, totalSteps fields |
| TS-4.2 | PanelState extension | PanelState type | Checking onboarding field | Field exists and accepts OnboardingState or null |
| TS-4.3 | Initial state | createInitialPanelState() called | Checking onboarding | Returns null |

## Acceptance Criteria

- [ ] OnboardingState interface exported
- [ ] PanelState includes onboarding field typed as OnboardingState | null
- [ ] createInitialPanelState() returns onboarding: null
- [ ] No breaking changes to existing PanelState consumers
- [ ] No vscode imports in application layer
