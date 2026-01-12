# Task 9: Add Onboarding Message Handlers

**Layer**: Adapters (inbound/ui)
**Dependencies**: Task 5, Task 6, Task 8

## Goal

Handle onboarding-related messages from the webview in SidecarPanelAdapter.

## Files to Modify

- `src/adapters/inbound/ui/SidecarPanelAdapter.ts`

## Implementation

### Add Message Types

Update the WebviewMessage type union:

```typescript
type WebviewMessage =
  // ... existing message types ...
  | { type: 'nextOnboardingStep' }
  | { type: 'previousOnboardingStep' }
  | { type: 'dismissOnboarding' }
  | { type: 'completeOnboarding' };
```

### Add Message Handlers

In the message handler switch statement:

```typescript
// Add to constructor or wherever message handlers are set up
this.panel.webview.onDidReceiveMessage(
  async (message: WebviewMessage) => {
    switch (message.type) {
      // ... existing cases ...

      case 'nextOnboardingStep':
        this.panelStateManager.nextOnboardingStep();
        break;

      case 'previousOnboardingStep':
        this.panelStateManager.previousOnboardingStep();
        break;

      case 'dismissOnboarding':
        await this.showOnboardingUseCase.completeOnboarding();
        this.panelStateManager.endOnboarding();
        vscode.window.showInformationMessage(
          "Onboarding skipped. Run 'Sidecar: Reset Onboarding' to see it again."
        );
        break;

      case 'completeOnboarding':
        await this.showOnboardingUseCase.completeOnboarding();
        this.panelStateManager.endOnboarding();
        break;
    }
  },
  undefined,
  this.disposables
);
```

### Update Constructor

Add showOnboardingUseCase dependency:

```typescript
export class SidecarPanelAdapter {
  constructor(
    // ... existing dependencies ...
    private readonly showOnboardingUseCase: IShowOnboardingUseCase,
  ) {
    // ... existing initialization ...
  }
}
```

## Test Scenarios

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| TS-9.1 | Next step message | Onboarding active | Receive nextOnboardingStep | panelStateManager.nextOnboardingStep() called |
| TS-9.2 | Previous step message | Onboarding active | Receive previousOnboardingStep | panelStateManager.previousOnboardingStep() called |
| TS-9.3 | Dismiss message | Onboarding active | Receive dismissOnboarding | completeOnboarding() and endOnboarding() called |
| TS-9.4 | Dismiss notification | Onboarding dismissed | After dismiss | Information message shown |
| TS-9.5 | Complete message | Last step | Receive completeOnboarding | completeOnboarding() and endOnboarding() called |
| TS-9.6 | No notification on complete | Complete normally | After complete | No notification shown |

## Acceptance Criteria

- [ ] WebviewMessage type includes all onboarding message types
- [ ] 'nextOnboardingStep' calls panelStateManager.nextOnboardingStep()
- [ ] 'previousOnboardingStep' calls panelStateManager.previousOnboardingStep()
- [ ] 'dismissOnboarding' calls completeOnboarding() then endOnboarding()
- [ ] 'completeOnboarding' calls completeOnboarding() then endOnboarding()
- [ ] Dismiss shows notification, complete does not
- [ ] SidecarPanelAdapter receives IShowOnboardingUseCase dependency
