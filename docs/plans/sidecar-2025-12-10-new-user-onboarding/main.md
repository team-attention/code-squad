# Implementation Plan: New User Onboarding

**Slug**: `sidecar-2025-12-10-new-user-onboarding`
**Spec**: `docs/specs/sidecar-2025-12-10-new-user-onboarding.md`
**Size**: LARGE (10 tasks)

## Scope Summary

| Phase | Description | Tasks |
|-------|-------------|-------|
| Phase 1 | Domain & Infrastructure Foundation | Task 1-3 |
| Phase 2 | Application Layer (Use Cases & State) | Task 4-6 |
| Phase 3 | Extension Wiring & Command Registration | Task 7 |
| Phase 4 | Webview Component Implementation | Task 8-9 |
| Phase 5 | Integration & Polish | Task 10 |

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Persistence mechanism | VSCode workspaceState | Standard VSCode API, per-workspace persistence as required |
| State management | Extend existing PanelState | Consistent with current architecture, single source of truth |
| Walkthrough component | New OnboardingWalkthrough.ts in webview/components | Follow existing component pattern (WaitingScreen, etc.) |
| Trigger timing | After first diff is visible | Ensures user sees content being explained during walkthrough |
| Step navigation | Sequential with Back/Next | Simpler UX, as recommended in spec |

## Technical Design

### Data Flow for Onboarding

```
AI Session Starts & First Diff Visible
      |
AIDetectionController.activateSidecar()
      |
workspaceStatePort.get('sidecar.onboardingCompleted')
      |
If not completed:
  ShowOnboardingWalkthroughUseCase.execute()
      |
  panelStateManager.startOnboarding()
      |
  renderState() renders OnboardingWalkthrough overlay
      |
User navigates steps via Next/Back/Skip
      |
On completion/dismiss:
  workspaceStatePort.set('sidecar.onboardingCompleted', true)
  panelStateManager.endOnboarding()
```

### Reset Onboarding Flow

```
User runs "Sidecar: Reset Onboarding" command
      |
ResetOnboardingUseCase.execute()
      |
workspaceStatePort.set('sidecar.onboardingCompleted', false)
      |
Show notification: "Onboarding will show on next AI session"
```

### State Changes

```typescript
// New field in PanelState (src/application/ports/outbound/PanelState.ts)
interface PanelState {
  // ... existing fields ...
  onboarding: OnboardingState | null;
}

interface OnboardingState {
  active: boolean;
  currentStep: number;
  totalSteps: number;
}

// New Port (src/application/ports/outbound/IWorkspaceStatePort.ts)
interface IWorkspaceStatePort {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): Promise<void>;
}
```

## Task Overview

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1 | Create OnboardingStep entity in domain layer | None |
| 2 | Create IWorkspaceStatePort interface | None |
| 3 | Create VscodeWorkspaceStateGateway | Task 2 |
| 4 | Add onboarding state to PanelState | None |
| 5 | Add onboarding methods to IPanelStateManager | Task 4 |
| 6 | Create ShowOnboardingWalkthroughUseCase and ResetOnboardingUseCase | Task 2, 4 |
| 7 | Wire gateway and register reset command in extension.ts | Task 3, 6 |
| 8 | Create OnboardingWalkthrough webview component with CSS | Task 4 |
| 9 | Add onboarding message handlers to SidecarPanelAdapter | Task 5, 6, 8 |
| 10 | Integrate onboarding trigger into AIDetectionController | Task 6, 7, 9 |

## Dependency Graph

```
Task 1 (OnboardingStep Entity) ---------------+
                                              |
Task 2 (IWorkspaceStatePort) ---> Task 3 (Gateway) ---> Task 7 (Extension Wiring)
                             |                                  |
                             +---> Task 6 (UseCases) -----------+
                                         |                      |
Task 4 (PanelState) ---> Task 5 (StateManager Methods) --+      |
         |                                               |      |
         +---> Task 8 (Webview Component) ---------------+      |
                                                         |      |
                       Task 9 (Message Handlers) --------+------+
                                                                |
                       Task 10 (Integration) -------------------+
```

## Layer Changes

```
src/
├── domain/
│   └── entities/
│       └── OnboardingStep.ts              # Task 1: Step entity
│
├── application/
│   ├── ports/
│   │   ├── inbound/
│   │   │   ├── IShowOnboardingUseCase.ts  # Task 6: Inbound port
│   │   │   └── IResetOnboardingUseCase.ts # Task 6: Inbound port
│   │   └── outbound/
│   │       ├── IWorkspaceStatePort.ts     # Task 2: New port
│   │       └── PanelState.ts              # Task 4: Add onboarding state
│   ├── services/
│   │   ├── IPanelStateManager.ts          # Task 5: Add onboarding methods
│   │   └── PanelStateManager.ts           # Task 5: Implement methods
│   └── useCases/
│       ├── ShowOnboardingWalkthroughUseCase.ts  # Task 6
│       └── ResetOnboardingUseCase.ts            # Task 6
│
├── adapters/
│   ├── inbound/
│   │   ├── controllers/
│   │   │   └── AIDetectionController.ts   # Task 10: Trigger onboarding
│   │   └── ui/
│   │       ├── SidecarPanelAdapter.ts     # Task 9: Message handlers
│   │       └── webview/
│   │           ├── components/
│   │           │   └── onboarding/
│   │           │       ├── OnboardingWalkthrough.ts  # Task 8
│   │           │       ├── OnboardingStep.ts         # Task 8
│   │           │       └── index.ts                  # Task 8
│   │           ├── styles.ts              # Task 8: Add onboarding CSS
│   │           └── core/
│   │               └── App.ts             # Task 8: Render onboarding
│   └── outbound/
│       └── gateways/
│           └── VscodeWorkspaceStateGateway.ts  # Task 3
│
├── extension.ts                           # Task 7: Wiring & command registration
│
└── test/
    ├── domain/
    │   └── entities/
    │       └── OnboardingStep.test.ts     # Task 1: Tests
    └── application/
        └── useCases/
            ├── ShowOnboardingWalkthroughUseCase.test.ts  # Task 6
            └── ResetOnboardingUseCase.test.ts            # Task 6
```

## Validation

After implementation:
1. `npm run compile` - No build errors
2. `npm run lint` - No lint errors
3. `npm run test` - All tests pass
4. Manual test: Fresh workspace, start AI session, verify walkthrough appears
5. Manual test: Navigate through all 7 steps using Next/Back buttons
6. Manual test: Dismiss with Skip button, verify flag persisted
7. Manual test: Close panel, restart AI session, verify walkthrough does NOT appear
8. Manual test: Run "Sidecar: Reset Onboarding" command, start AI session, verify walkthrough appears again
9. Manual test: Verify keyboard navigation (Escape, Enter, arrows)
10. Manual test: Verify focus trap within overlay
11. Manual test: Verify VSCode theme variables work in dark/light modes

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| workspaceState not persisting | Onboarding shows repeatedly | Test persistence across VSCode restarts |
| CSS selector targeting wrong elements | Tooltips mispositioned | Use stable IDs, test with different panel sizes |
| Focus trap breaks panel interaction | Users stuck in overlay | Provide multiple escape routes (Skip, Escape, click outside) |
| Timing race with first diff | Onboarding triggers too early | Wait for diff state to be non-null before checking |
| Memory leak from event listeners | Performance degradation | Cleanup listeners on overlay dismiss |

## Critical Files

- `src/application/ports/outbound/PanelState.ts` - Core state interface that needs OnboardingState addition
- `src/application/services/IPanelStateManager.ts` - Interface for new onboarding state methods
- `src/adapters/inbound/ui/SidecarPanelAdapter.ts` - Message handler integration point for webview communication
- `src/adapters/inbound/controllers/AIDetectionController.ts` - Trigger point for onboarding after AI detection
- `src/adapters/inbound/ui/webview/core/App.ts` - Main webview orchestrator where onboarding overlay will be rendered
