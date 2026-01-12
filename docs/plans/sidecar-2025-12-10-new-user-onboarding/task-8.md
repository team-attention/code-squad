# Task 8: Create OnboardingWalkthrough Webview Component

**Layer**: Adapters (inbound/ui/webview)
**Dependencies**: Task 4

## Goal

Create the OnboardingWalkthrough webview component that renders the walkthrough overlay with tooltips, step navigation, and accessibility support.

## Files to Create

- `src/adapters/inbound/ui/webview/components/onboarding/OnboardingWalkthrough.ts`
- `src/adapters/inbound/ui/webview/components/onboarding/OnboardingTooltip.ts`
- `src/adapters/inbound/ui/webview/components/onboarding/index.ts`

## Files to Modify

- `src/adapters/inbound/ui/webview/styles.ts` (add onboarding CSS)
- `src/adapters/inbound/ui/webview/core/App.ts` (render onboarding overlay)
- `src/adapters/inbound/ui/webview/components/index.ts` (export)

## Implementation

### OnboardingWalkthrough Component

```typescript
// src/adapters/inbound/ui/webview/components/onboarding/OnboardingWalkthrough.ts

import { OnboardingState } from '../../../../../../application/ports/outbound/PanelState';
import { WALKTHROUGH_STEPS } from '../../../../../../domain/entities/OnboardingStep';
import { renderOnboardingTooltip } from './OnboardingTooltip';

export function renderOnboardingOverlay(state: OnboardingState): string {
  const step = WALKTHROUGH_STEPS[state.currentStep];
  const isLastStep = state.currentStep === state.totalSteps - 1;
  const isFirstStep = state.currentStep === 0;
  const isCenterPosition = step.position === 'center';

  return `
    <div class="onboarding-overlay"
         role="dialog"
         aria-modal="true"
         aria-labelledby="onboarding-title"
         tabindex="-1">
      <div class="onboarding-backdrop"></div>
      ${!isCenterPosition ? `<div class="onboarding-highlight" data-target="${step.targetSelector}"></div>` : ''}
      ${renderOnboardingTooltip({
        step,
        currentStep: state.currentStep,
        totalSteps: state.totalSteps,
        showBackButton: step.showBackButton,
        isLastStep,
      })}
    </div>
  `;
}

export function getOnboardingScripts(): string {
  return `
    // Onboarding keyboard navigation
    function handleOnboardingKeydown(e) {
      const overlay = document.querySelector('.onboarding-overlay');
      if (!overlay) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          vscode.postMessage({ type: 'dismissOnboarding' });
          break;
        case 'Enter':
          e.preventDefault();
          const nextBtn = document.getElementById('onboarding-next');
          if (nextBtn) nextBtn.click();
          break;
        case 'ArrowRight':
          e.preventDefault();
          vscode.postMessage({ type: 'nextOnboardingStep' });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          vscode.postMessage({ type: 'previousOnboardingStep' });
          break;
      }
    }

    // Focus trap
    function trapFocus(overlay) {
      const focusable = overlay.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      overlay.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      });

      first.focus();
    }

    // Position highlight on target element
    function positionHighlight() {
      const highlight = document.querySelector('.onboarding-highlight');
      if (!highlight) return;

      const targetSelector = highlight.dataset.target;
      if (!targetSelector) return;

      const target = document.querySelector(targetSelector);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      highlight.style.top = (rect.top - 4) + 'px';
      highlight.style.left = (rect.left - 4) + 'px';
      highlight.style.width = (rect.width + 8) + 'px';
      highlight.style.height = (rect.height + 8) + 'px';
    }

    // Initialize onboarding
    function initOnboarding() {
      const overlay = document.querySelector('.onboarding-overlay');
      if (!overlay) return;

      document.addEventListener('keydown', handleOnboardingKeydown);
      trapFocus(overlay);
      positionHighlight();
    }

    initOnboarding();
  `;
}
```

### OnboardingTooltip Component

```typescript
// src/adapters/inbound/ui/webview/components/onboarding/OnboardingTooltip.ts

import { OnboardingStep } from '../../../../../../domain/entities/OnboardingStep';

interface TooltipProps {
  step: OnboardingStep;
  currentStep: number;
  totalSteps: number;
  showBackButton: boolean;
  isLastStep: boolean;
}

export function renderOnboardingTooltip(props: TooltipProps): string {
  const { step, currentStep, totalSteps, showBackButton, isLastStep } = props;

  const positionClass = `tooltip-${step.position}`;
  const description = step.description.replace(/\n/g, '<br>');

  return `
    <div class="onboarding-tooltip ${positionClass}" role="document">
      <div class="tooltip-header">
        <h2 id="onboarding-title" class="tooltip-title">${step.title}</h2>
        <button class="tooltip-close"
                aria-label="Close walkthrough"
                onclick="vscode.postMessage({ type: 'dismissOnboarding' })">
          ×
        </button>
      </div>
      <div class="tooltip-content">
        <p class="tooltip-description">${description}</p>
      </div>
      <div class="tooltip-footer">
        <span class="tooltip-progress">${currentStep + 1} / ${totalSteps}</span>
        <div class="tooltip-actions">
          ${showBackButton ? `
            <button class="tooltip-btn tooltip-btn-secondary"
                    onclick="vscode.postMessage({ type: 'previousOnboardingStep' })">
              Back
            </button>
          ` : ''}
          <button class="tooltip-btn tooltip-btn-secondary"
                  onclick="vscode.postMessage({ type: 'dismissOnboarding' })">
            Skip
          </button>
          <button id="onboarding-next"
                  class="tooltip-btn tooltip-btn-primary"
                  onclick="vscode.postMessage({ type: '${isLastStep ? 'completeOnboarding' : 'nextOnboardingStep'}' })">
            ${isLastStep ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  `;
}
```

### CSS Styles

Add to styles.ts:

```typescript
export const onboardingStyles = `
  /* Onboarding Overlay */
  .onboarding-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .onboarding-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
  }

  .onboarding-highlight {
    position: absolute;
    border: 2px solid var(--vscode-focusBorder);
    border-radius: 4px;
    z-index: 1001;
    pointer-events: none;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(var(--vscode-focusBorder-rgb, 0, 122, 204), 0.4); }
    50% { box-shadow: 0 0 0 8px rgba(var(--vscode-focusBorder-rgb, 0, 122, 204), 0); }
  }

  /* Tooltip */
  .onboarding-tooltip {
    position: relative;
    z-index: 1002;
    max-width: 400px;
    background: var(--vscode-editorWidget-background);
    border: 1px solid var(--vscode-editorWidget-border);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    padding: 16px;
  }

  .tooltip-center {
    /* Center position - default flexbox centering applies */
  }

  .tooltip-top,
  .tooltip-bottom,
  .tooltip-left,
  .tooltip-right {
    position: absolute;
  }

  .tooltip-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .tooltip-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--vscode-foreground);
    margin: 0;
  }

  .tooltip-close {
    background: none;
    border: none;
    color: var(--vscode-foreground);
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
    padding: 0;
    opacity: 0.7;
  }

  .tooltip-close:hover {
    opacity: 1;
  }

  .tooltip-content {
    margin-bottom: 16px;
  }

  .tooltip-description {
    color: var(--vscode-descriptionForeground);
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
  }

  .tooltip-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tooltip-progress {
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
  }

  .tooltip-actions {
    display: flex;
    gap: 8px;
  }

  .tooltip-btn {
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    border: none;
  }

  .tooltip-btn-primary {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }

  .tooltip-btn-primary:hover {
    background: var(--vscode-button-hoverBackground);
  }

  .tooltip-btn-secondary {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
  }

  .tooltip-btn-secondary:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }
`;
```

### Update App.ts

Add onboarding rendering:

```typescript
// In renderState function
if (state.onboarding?.active) {
  return `
    ${existingContent}
    ${renderOnboardingOverlay(state.onboarding)}
    <script>${getOnboardingScripts()}</script>
  `;
}
```

## Test Scenarios

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| TS-8.1 | Overlay renders | onboarding.active=true | renderOnboardingOverlay | Returns HTML with backdrop and tooltip |
| TS-8.2 | Step content | currentStep=0 | renderOnboardingOverlay | Shows "Welcome to Sidecar" title |
| TS-8.3 | Progress indicator | currentStep=2, totalSteps=7 | renderOnboardingOverlay | Shows "3 / 7" |
| TS-8.4 | Back button hidden | currentStep=0 | renderOnboardingOverlay | Back button not rendered |
| TS-8.5 | Done button | Last step | renderOnboardingOverlay | Shows "Done" instead of "Next" |
| TS-8.6 | Escape key | Overlay visible | Press Escape | Posts dismissOnboarding message |
| TS-8.7 | Enter key | Overlay visible | Press Enter | Clicks next button |
| TS-8.8 | Focus trap | Overlay visible | Tab from last element | Focus moves to first element |

## Acceptance Criteria

- [ ] OnboardingWalkthrough component renders overlay with backdrop
- [ ] OnboardingTooltip shows step title, description, progress
- [ ] Back button hidden on first step (showBackButton=false)
- [ ] Next button shows "Done" on last step
- [ ] Skip button visible on all steps
- [ ] Keyboard navigation: Escape dismisses, Enter advances, arrows navigate
- [ ] Focus trapped within overlay
- [ ] CSS uses VSCode theme variables
- [ ] Pulse animation on highlighted elements
- [ ] Components exported from onboarding/index.ts
- [ ] App.ts conditionally renders overlay when onboarding.active
