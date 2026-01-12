# Task 6: Extract AIStatus Component

**Status**: Ready
**Estimated Time**: 30 minutes
**Dependencies**: Task 3

## Objective

Extract the AI status indicator rendering into a separate component. This is a simple component that shows which AI is currently active.

## Changes

### Files to Create

1. `/src/adapters/inbound/ui/webview/components/sidebar/AIStatus.ts`

### Files to Modify

1. `/src/adapters/inbound/ui/webview/components/index.ts` - Add export
2. `/src/adapters/inbound/ui/webview/script.ts` - Import and use AIStatus component

## Implementation Steps

### Step 1: Create AIStatus Component

Create `/src/adapters/inbound/ui/webview/components/sidebar/AIStatus.ts`:

```typescript
/**
 * AI Status Component
 *
 * Displays the current AI assistant status (Claude, Codex, Gemini, or Ready).
 */

export interface AIStatusData {
  active: boolean;
  type?: 'claude' | 'codex' | 'gemini' | string;
}

/**
 * Render AI status badge
 * Updates the DOM directly
 */
export function renderAIStatus(aiStatus: AIStatusData): void {
  const badge = document.getElementById('status-badge');
  const typeEl = document.getElementById('ai-type');

  if (!badge || !typeEl) return;

  if (aiStatus.active && aiStatus.type) {
    const label = aiStatus.type === 'claude' ? 'Claude' :
                  aiStatus.type === 'codex' ? 'Codex' :
                  aiStatus.type === 'gemini' ? 'Gemini' : aiStatus.type;
    typeEl.textContent = label;
    badge.classList.add('active');
  } else {
    typeEl.textContent = 'Ready';
    badge.classList.remove('active');
  }
}
```

**Source**: Lines 1005-1020 of script.ts

### Step 2: Update Components Index

Add to `/src/adapters/inbound/ui/webview/components/index.ts`:

```typescript
export { renderAIStatus } from './sidebar/AIStatus';
export type { AIStatusData } from './sidebar/AIStatus';
```

### Step 3: Update script.ts

Import at top:
```typescript
import { renderAIStatus, AIStatusData } from './components';
```

Remove lines 1005-1020 from script.ts.

## Test Scenarios

### Test 1: Ready State
**Given**: No AI active
**When**: Panel loads
**Then**: Badge shows "Ready", not highlighted

### Test 2: Claude Active
**Given**: Claude Code running
**When**: AI status updated
**Then**: Badge shows "Claude", highlighted

### Test 3: Codex Active
**Given**: Codex running
**When**: AI status updated
**Then**: Badge shows "Codex", highlighted

### Test 4: Gemini Active
**Given**: Gemini running
**When**: AI status updated
**Then**: Badge shows "Gemini", highlighted

## Acceptance Criteria

-  AIStatus component created
-  All AI types render correctly
-  Badge highlighting works
-  Build succeeds
-  No console errors

## Rollback

```bash
git checkout src/adapters/inbound/ui/webview/script.ts
rm src/adapters/inbound/ui/webview/components/sidebar/AIStatus.ts
npm run esbuild
```

## Notes

- Simple component with no dependencies beyond DOM utilities
- Direct DOM manipulation (no HTML string return)
- Called from renderState in script.ts
- Badge element defined in html.ts
