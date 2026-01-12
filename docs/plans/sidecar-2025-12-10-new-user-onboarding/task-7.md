# Task 7: Wire Gateway and Register Command

**Layer**: Extension entry point
**Dependencies**: Task 3, Task 6

## Goal

Wire up VscodeWorkspaceStateGateway in extension.ts and register the "Sidecar: Reset Onboarding" command.

## Files to Modify

- `src/extension.ts`
- `package.json` (add command contribution)

## Implementation

### Update extension.ts

Add gateway creation and command registration:

```typescript
// In activate() function, after context initialization

// Create workspace state gateway
const workspaceStateGateway = new VscodeWorkspaceStateGateway(context.workspaceState);

// Create onboarding use cases
const showOnboardingUseCase = new ShowOnboardingWalkthroughUseCase(
  workspaceStateGateway,
  panelStateManager,
);
const resetOnboardingUseCase = new ResetOnboardingUseCase(workspaceStateGateway);

// Register reset onboarding command
const resetOnboardingCommand = vscode.commands.registerCommand(
  'sidecar.resetOnboarding',
  async () => {
    await resetOnboardingUseCase.execute();
    vscode.window.showInformationMessage(
      'Onboarding reset. It will show next time you start an AI session.'
    );
  }
);
context.subscriptions.push(resetOnboardingCommand);

// Pass showOnboardingUseCase to AIDetectionController or SidecarPanelAdapter
// (whichever handles the trigger - determined in Task 10)
```

### Update package.json

Add command contribution:

```json
{
  "contributes": {
    "commands": [
      // ... existing commands ...
      {
        "command": "sidecar.resetOnboarding",
        "title": "Sidecar: Reset Onboarding"
      }
    ]
  }
}
```

### Import Statements

Add to extension.ts imports:

```typescript
import { VscodeWorkspaceStateGateway } from './adapters/outbound/gateways';
import { ShowOnboardingWalkthroughUseCase, ResetOnboardingUseCase } from './application/useCases';
```

## Test Scenarios

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| TS-7.1 | Gateway creation | Extension activates | activate() runs | VscodeWorkspaceStateGateway created with context.workspaceState |
| TS-7.2 | Use case creation | Gateway exists | activate() runs | ShowOnboardingWalkthroughUseCase and ResetOnboardingUseCase created |
| TS-7.3 | Command registration | Extension activates | activate() runs | 'sidecar.resetOnboarding' command registered |
| TS-7.4 | Command execution | Command registered | User runs command | ResetOnboardingUseCase.execute() called |
| TS-7.5 | Notification shown | Command executed | Reset completes | Information message displayed |

## Acceptance Criteria

- [ ] VscodeWorkspaceStateGateway instantiated with context.workspaceState
- [ ] ShowOnboardingWalkthroughUseCase created with gateway and panelStateManager
- [ ] ResetOnboardingUseCase created with gateway
- [ ] 'sidecar.resetOnboarding' command registered
- [ ] Command calls resetOnboardingUseCase.execute()
- [ ] Success notification shown after reset
- [ ] Command added to package.json contributes.commands
- [ ] All new subscriptions added to context.subscriptions
