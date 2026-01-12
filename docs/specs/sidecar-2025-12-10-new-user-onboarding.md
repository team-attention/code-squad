# Spec: New User Onboarding

**Slug**: `sidecar-2025-12-10-new-user-onboarding`
**Created**: 2025-12-10

## Summary

Provide a guided first-time user experience that introduces Sidecar's core features and workflow. When a user installs Sidecar and triggers it for the first time (AI detection), show an interactive walkthrough that explains the panel layout, how to review diffs, add comments, and submit feedback to AI.

## Problem

New users who install Sidecar face several challenges:
- **Discovery gap**: They don't understand what triggers Sidecar or when it activates
- **Feature blindness**: The panel appears automatically but users don't know what they're looking at or how to use it
- **Workflow confusion**: Users don't understand the review-comment-submit workflow
- **Missed capabilities**: Advanced features (scope view, inline comments, markdown preview) go undiscovered

This leads to:
- Low activation rates (users install but never engage)
- Frustration when the panel appears unexpectedly
- Underutilization of key features
- Support burden from basic "how do I use this?" questions

## Use Cases

### UC-1: ShowOnboardingWalkthrough
- **Actor**: First-time Sidecar user
- **Trigger**: AI session detected for the first time (Sidecar panel opens automatically)
- **Preconditions**:
  - Sidecar installed
  - No previous onboarding completion flag in workspace state
  - AI session active (Claude Code, Codex, or Gemini detected)
  - Panel has opened and initial file changes are visible
- **Flow**:
  1. User runs AI tool (e.g., `claude`) in VSCode terminal
  2. Sidecar detects AI and opens panel
  3. System checks workspace state for `onboardingCompleted` flag
  4. If flag is false/missing, system overlays walkthrough UI
  5. Walkthrough shows step-by-step tooltips highlighting:
     - Step 1: "Welcome to Sidecar" (overview)
     - Step 2: File list sidebar (what it shows)
     - Step 3: Diff viewer (how to read changes)
     - Step 4: Adding comments (click + drag to select lines)
     - Step 5: Submitting feedback (submit button)
     - Step 6: Advanced features (scope view, inline comments)
  6. User clicks "Next" to progress through steps or "Skip" to exit
  7. On completion or skip, system sets `onboardingCompleted: true` in workspace state
- **Postconditions**:
  - User has seen core feature explanations
  - Onboarding flag persisted to workspace state
  - Walkthrough dismissed, normal panel view restored
- **Business Rules**:
  - Show only once per workspace
  - Must be dismissible at any step
  - Should not block panel functionality during walkthrough
  - Position tooltips dynamically based on actual UI elements
- **Location**: `application/useCases/ShowOnboardingWalkthroughUseCase.ts`

### UC-2: ResetOnboarding
- **Actor**: User or developer
- **Trigger**: User executes "Sidecar: Reset Onboarding" command from command palette
- **Preconditions**: Sidecar installed
- **Flow**:
  1. User opens command palette (Cmd/Ctrl+Shift+P)
  2. User searches for and selects "Sidecar: Reset Onboarding"
  3. System clears `onboardingCompleted` flag from workspace state
  4. System shows notification: "Onboarding reset. It will show next time you start an AI session."
- **Postconditions**:
  - Onboarding flag cleared
  - Next AI session trigger will show walkthrough again
- **Business Rules**:
  - Available even if onboarding was never completed
  - Does not immediately show walkthrough (only on next AI trigger)
- **Location**: `application/useCases/ResetOnboardingUseCase.ts`

### UC-3: DismissOnboarding
- **Actor**: First-time user during walkthrough
- **Trigger**: User clicks "Skip" button or close icon on walkthrough overlay
- **Preconditions**: Onboarding walkthrough is currently displayed
- **Flow**:
  1. User clicks "Skip" button or close icon
  2. System hides walkthrough overlay
  3. System sets `onboardingCompleted: true` in workspace state
  4. System shows dismissible notification: "Onboarding skipped. Run 'Sidecar: Reset Onboarding' to see it again."
- **Postconditions**:
  - Walkthrough removed from view
  - Onboarding marked as completed
  - User can resume normal panel usage
- **Business Rules**:
  - Must persist completion even on skip
  - Should provide easy way to re-trigger (via command)
- **Location**: Part of `ShowOnboardingWalkthroughUseCase.ts` (dismiss logic)

## UI/UX Requirements

### Walkthrough Steps

#### Step 1: Welcome
- **Position**: Center overlay
- **Content**:
  - Heading: "Welcome to Sidecar"
  - Body: "Sidecar helps you review AI-generated code changes in real-time. Let's take a quick tour."
  - Visual: Sidecar logo/icon
- **Actions**: [Next] [Skip]

#### Step 2: AI Detection
- **Position**: Tooltip near AI status indicator in sidebar
- **Content**:
  - Heading: "AI Session Active"
  - Body: "Sidecar automatically detects when you run Claude, Codex, or Gemini in the terminal."
  - Highlight: AI status section
- **Actions**: [Next] [Skip]

#### Step 3: File List
- **Position**: Tooltip on file list area
- **Content**:
  - Heading: "Changed Files"
  - Body: "See all files modified by the AI. Click any file to view its diff."
  - Highlight: File list sidebar
- **Actions**: [Back] [Next] [Skip]

#### Step 4: Diff Viewer
- **Position**: Tooltip on main content area
- **Content**:
  - Heading: "Review Changes"
  - Body: "Green lines are additions, red lines are deletions. Review code line by line."
  - Highlight: Diff viewer area
- **Actions**: [Back] [Next] [Skip]

#### Step 5: Adding Comments
- **Position**: Tooltip near comment button/gutter
- **Content**:
  - Heading: "Add Feedback"
  - Body: "Select lines by dragging in the gutter, then add your comments."
  - Highlight: Line gutter area
  - Optional: Show mini animation of selecting lines
- **Actions**: [Back] [Next] [Skip]

#### Step 6: Submit Comments
- **Position**: Tooltip near submit button
- **Content**:
  - Heading: "Send to AI"
  - Body: "Click Submit to send all your comments back to the AI terminal."
  - Highlight: Submit button
- **Actions**: [Back] [Next] [Skip]

#### Step 7: Advanced Features
- **Position**: Center overlay
- **Content**:
  - Heading: "You're All Set!"
  - Body: "Explore advanced features:\n- Scope View: See changes grouped by function/class\n- Inline Comments: Comments appear directly in the diff\n- Markdown Preview: Preview markdown files"
  - Visual: Icons for each feature
- **Actions**: [Done]

### Visual Design

- **Overlay**: Semi-transparent dark backdrop (backdrop-filter: blur(2px), background: rgba(0,0,0,0.5))
- **Tooltips**: VSCode theme-aware styling
  - Background: `var(--vscode-editorWidget-background)`
  - Border: `var(--vscode-editorWidget-border)`
  - Shadow: `0 4px 16px rgba(0,0,0,0.3)`
  - Arrow pointing to highlighted element
- **Highlighted Elements**: Pulsing border effect
  - Border: `2px solid var(--vscode-focusBorder)`
  - Animation: pulse 2s ease-in-out infinite
- **Progress Indicator**: Step counter (e.g., "2 / 7")
- **Buttons**: VSCode button styling
  - Primary: "Next" / "Done"
  - Secondary: "Back" / "Skip"

### Accessibility

- Focus management: Trap focus within walkthrough modal
- Keyboard navigation:
  - Arrow keys: Navigate steps
  - Escape: Dismiss walkthrough
  - Enter: Activate primary button
- Screen reader: Announce each step heading and content
- High contrast mode: Support VSCode high contrast themes

## Out of Scope

- Video tutorials or embedded GIFs
- Interactive practice mode (user tries features during walkthrough)
- Multi-language support (English only initially)
- Separate onboarding for each feature area (single unified walkthrough)
- Contextual tips after onboarding completion (separate feature)
- Analytics tracking of onboarding completion rates
- Per-user settings (workspace-scoped only)

## Open Questions

1. **Trigger timing**: Should onboarding wait for first file diff to appear, or show immediately when panel opens?
   - Recommendation: Wait for first file with diff to ensure content is visible during walkthrough

2. **Completion criteria**: Mark as complete only on "Done" click, or also when user completes all steps?
   - Recommendation: Mark complete on any dismissal (Done, Skip, or close icon)

3. **Re-trigger mechanism**: Should there be a "Show Tips" button in the panel UI for easy re-access?
   - Recommendation: Command palette only (keep panel UI clean)

4. **Step skipping**: Allow users to jump to specific steps, or enforce sequential navigation?
   - Recommendation: Sequential only with Back/Next (simpler UX)

5. **Animation duration**: How long should highlight pulses and transitions last?
   - Recommendation: 300ms transitions, 2s pulse cycle

6. **Mobile/small screens**: How should walkthrough adapt to narrow panel widths?
   - Recommendation: Stack tooltips above content, reduce tooltip width, simplify content

## Technical Notes

### Persistence
- Store `onboardingCompleted` flag in VSCode workspace state (ExtensionContext.workspaceState)
- Key: `sidecar.onboardingCompleted`
- Value: `{ completed: boolean, timestamp: string }`

### State Management
- Add `onboardingState` to webview state:
  ```typescript
  interface PanelState {
    // existing fields...
    onboarding: {
      active: boolean;
      currentStep: number;
      totalSteps: number;
    } | null;
  }
  ```

### Message Types
```typescript
type WebviewMessage =
  | { type: 'startOnboarding' }
  | { type: 'nextOnboardingStep' }
  | { type: 'previousOnboardingStep' }
  | { type: 'dismissOnboarding' }
  | { type: 'completeOnboarding' }
  // existing...
```

### Architecture
- **UseCase**: `ShowOnboardingWalkthroughUseCase` (orchestrates walkthrough logic)
- **UseCase**: `ResetOnboardingUseCase` (clears completion flag)
- **Port**: `IWorkspaceStatePort` (read/write workspace state)
- **Gateway**: `VscodeWorkspaceStateGateway` (ExtensionContext.workspaceState wrapper)
- **Adapter**: `SidecarPanelAdapter` (handles webview messages, triggers use cases)
- **Webview**: New component `OnboardingWalkthrough.ts` (renders tooltip UI)

### Walkthrough Steps Configuration
Define steps as a static configuration array in domain layer:
```typescript
// domain/entities/OnboardingStep.ts
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string; // CSS selector for highlighted element
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  showBackButton: boolean;
}
```

## References

- Existing specs: `/docs/specs/sidecar-2025-12-04-comment-management.md`
- Architecture: `/docs/overview.md`
- VSCode Extension Context API: https://code.visualstudio.com/api/references/vscode-api#ExtensionContext
