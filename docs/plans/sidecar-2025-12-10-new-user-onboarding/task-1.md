# Task 1: Create OnboardingStep Entity

**Layer**: Domain
**Dependencies**: None

## Goal

Create a domain entity representing an onboarding step with all necessary data for rendering the walkthrough UI.

## Files to Create

- `src/domain/entities/OnboardingStep.ts`

## Implementation

### OnboardingStep Entity

```typescript
// src/domain/entities/OnboardingStep.ts

export type TooltipPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;  // CSS selector for highlighted element
  position: TooltipPosition;
  showBackButton: boolean;
}

export const WALKTHROUGH_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Sidecar',
    description: 'Sidecar helps you review AI-generated code changes in real-time. Let\'s take a quick tour.',
    targetSelector: '',  // Center overlay, no target
    position: 'center',
    showBackButton: false,
  },
  {
    id: 'ai-detection',
    title: 'AI Session Active',
    description: 'Sidecar automatically detects when you run Claude, Codex, or Gemini in the terminal.',
    targetSelector: '[data-testid="ai-status"]',
    position: 'bottom',
    showBackButton: true,
  },
  {
    id: 'file-list',
    title: 'Changed Files',
    description: 'See all files modified by the AI. Click any file to view its diff.',
    targetSelector: '[data-testid="file-list"]',
    position: 'right',
    showBackButton: true,
  },
  {
    id: 'diff-viewer',
    title: 'Review Changes',
    description: 'Green lines are additions, red lines are deletions. Review code line by line.',
    targetSelector: '[data-testid="diff-viewer"]',
    position: 'left',
    showBackButton: true,
  },
  {
    id: 'adding-comments',
    title: 'Add Feedback',
    description: 'Select lines by dragging in the gutter, then add your comments.',
    targetSelector: '[data-testid="line-gutter"]',
    position: 'right',
    showBackButton: true,
  },
  {
    id: 'submit-comments',
    title: 'Send to AI',
    description: 'Click Submit to send all your comments back to the AI terminal.',
    targetSelector: '[data-testid="submit-button"]',
    position: 'top',
    showBackButton: true,
  },
  {
    id: 'advanced-features',
    title: 'You\'re All Set!',
    description: 'Explore advanced features:\n• Scope View: See changes grouped by function/class\n• Inline Comments: Comments appear directly in the diff\n• Markdown Preview: Preview markdown files',
    targetSelector: '',  // Center overlay, no target
    position: 'center',
    showBackButton: true,
  },
];

export const TOTAL_ONBOARDING_STEPS = WALKTHROUGH_STEPS.length;
```

## Test Scenarios

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| TS-1.1 | Step structure validation | WALKTHROUGH_STEPS array | Accessing any step | All required fields are present |
| TS-1.2 | Step count | WALKTHROUGH_STEPS array | Getting length | Returns 7 steps |
| TS-1.3 | Step order | WALKTHROUGH_STEPS array | Accessing steps by index | Order is: welcome, ai-detection, file-list, diff-viewer, adding-comments, submit-comments, advanced-features |
| TS-1.4 | First step config | First step | Checking showBackButton | Returns false |
| TS-1.5 | Center steps | Steps with position='center' | Checking targetSelector | Returns empty string |

## Acceptance Criteria

- [ ] OnboardingStep interface exported
- [ ] TooltipPosition type exported
- [ ] WALKTHROUGH_STEPS array exported with 7 steps
- [ ] TOTAL_ONBOARDING_STEPS constant exported
- [ ] All steps have unique IDs
- [ ] First step has showBackButton: false
- [ ] Steps with position='center' have empty targetSelector
- [ ] No vscode imports in domain layer
