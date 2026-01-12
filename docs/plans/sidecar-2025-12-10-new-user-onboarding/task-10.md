# Task 10: Integrate Onboarding Trigger

**Layer**: Adapters (inbound/controllers)
**Dependencies**: Task 6, Task 7, Task 9

## Goal

Trigger onboarding walkthrough when AI is detected and first diff is visible, for first-time users.

## Files to Modify

- `src/adapters/inbound/controllers/AIDetectionController.ts`

## Implementation

### Add Use Case Dependency

Update AIDetectionController constructor:

```typescript
export class AIDetectionController {
  private onboardingTriggered = false;

  constructor(
    // ... existing dependencies ...
    private readonly showOnboardingUseCase: IShowOnboardingUseCase,
  ) {
    // ... existing initialization ...
  }
}
```

### Add Onboarding Trigger Logic

Create a method to check and trigger onboarding:

```typescript
private async checkAndTriggerOnboarding(): Promise<void> {
  // Only trigger once per session
  if (this.onboardingTriggered) return;

  // Check if there's at least one file with diff visible
  const state = this.panelStateManager.getState();
  const hasVisibleDiff = state.files.some(file =>
    file.diff && file.diff.length > 0
  );

  if (!hasVisibleDiff) return;

  this.onboardingTriggered = true;
  await this.showOnboardingUseCase.execute();
}
```

### Hook Into File Change Event

Call checkAndTriggerOnboarding when files are updated:

```typescript
// In the method that handles file changes (e.g., onFileChange, updateFiles)
// After updating the panel state with new file diffs:

await this.checkAndTriggerOnboarding();
```

Alternative: Hook into state change callback:

```typescript
// If using state change subscription pattern
this.panelStateManager.onStateChange(async (state) => {
  if (state.files.some(f => f.diff?.length)) {
    await this.checkAndTriggerOnboarding();
  }
});
```

### Reset Trigger on Session End

Reset the flag when AI session ends:

```typescript
// In deactivateSidecar or session end handler
this.onboardingTriggered = false;
```

## Test Scenarios

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| TS-10.1 | First diff visible | AI session active, no diff yet | First file with diff appears | showOnboardingUseCase.execute() called |
| TS-10.2 | Already triggered | onboardingTriggered=true | Another file changes | execute() NOT called again |
| TS-10.3 | Already completed | Workspace has onboardingCompleted=true | First diff appears | Onboarding not shown (use case returns false) |
| TS-10.4 | No diff | AI session active | No files have diffs | execute() NOT called |
| TS-10.5 | Session end reset | AI session ends | Session terminates | onboardingTriggered reset to false |
| TS-10.6 | New session | Previous session completed onboarding | New AI session starts | Flag cleared, but use case checks workspace state |

## Acceptance Criteria

- [ ] AIDetectionController receives IShowOnboardingUseCase dependency
- [ ] onboardingTriggered flag prevents multiple triggers per session
- [ ] Onboarding triggered only after first file with diff is visible
- [ ] showOnboardingUseCase.execute() called at correct time
- [ ] Flag reset when AI session ends
- [ ] Works with existing file watching and diff generation flow

## Integration Notes

The exact location of the trigger call depends on the existing file watching architecture:

1. **Option A**: Hook into file change event handler after diff is generated
2. **Option B**: Use panelStateManager.onStateChange() subscription
3. **Option C**: Add check after successful CaptureSnapshotsUseCase execution

Choose based on which gives the most reliable timing (after diff is visible but before user starts reviewing).

## Wiring in extension.ts

Update extension.ts to pass the use case to AIDetectionController:

```typescript
const aiDetectionController = new AIDetectionController(
  // ... existing dependencies ...
  showOnboardingUseCase,
);
```
