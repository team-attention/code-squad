# Task 7: Extract LineSelection Component

**Component**: LineSelection
**File**: `src/adapters/inbound/ui/webview/components/diff/LineSelection.ts`
**Source Lines**: 2568-2677 in script.ts
**Complexity**: Medium
**Dependencies**: `state/StateManager.ts` (SelectionState)

## Objective

Extract line selection logic for both single-line and multi-line selection in diff views. This is shared by both unified diff and scoped diff views.

## Current Code Location

```typescript
// script.ts lines 2568-2677
// Line selection: single click, drag selection, range updates
```

## Functions to Extract

| Function | Description |
|----------|-------------|
| `handleLineMouseDown()` | Start selection on mousedown |
| `handleLineMouseMove()` | Update selection during drag |
| `handleLineMouseUp()` | Finalize selection on mouseup |
| `updateLineSelection()` | Update visual selection range |
| `clearLineSelection()` | Clear current selection |
| `getLineNumber()` | Extract line number from element |
| `isSelectableLine()` | Check if line can be selected |

## Implementation

### 1. Create LineSelection.ts

```typescript
// components/diff/LineSelection.ts

export interface SelectionState {
  startLine: number | null;
  endLine: number | null;
  startRow: HTMLElement | null;
  endRow: HTMLElement | null;
  isSelecting: boolean;
}

export interface LineSelectionHandlers {
  onSelectionChange: (state: SelectionState) => void;
  onSelectionComplete: (startLine: number, endLine: number) => void;
}

/**
 * Handle mousedown on diff line
 * @param event - Mouse event
 * @param state - Current selection state
 * @returns Updated selection state
 */
export function handleLineMouseDown(
  event: MouseEvent,
  state: SelectionState
): SelectionState {
  // Extract from script.ts
}

/**
 * Handle mousemove during line selection
 * @param event - Mouse event
 * @param state - Current selection state
 * @returns Updated selection state
 */
export function handleLineMouseMove(
  event: MouseEvent,
  state: SelectionState
): SelectionState {
  // Extract from script.ts
}

/**
 * Handle mouseup to complete selection
 * @param event - Mouse event
 * @param state - Current selection state
 * @returns Final selection state
 */
export function handleLineMouseUp(
  event: MouseEvent,
  state: SelectionState
): SelectionState {
  // Extract from script.ts
}

/**
 * Update visual highlighting for selection range
 * @param container - Diff container
 * @param startLine - Start line number
 * @param endLine - End line number
 */
export function updateLineSelection(
  container: HTMLElement,
  startLine: number,
  endLine: number
): void {
  // Extract from script.ts
}

/**
 * Clear all line selection
 * @param container - Diff container
 * @returns Reset selection state
 */
export function clearLineSelection(container: HTMLElement): SelectionState {
  // Extract from script.ts
}

/**
 * Setup line selection handlers on container
 * @param container - Diff container
 * @param handlers - Selection callbacks
 * @param signal - AbortSignal for cleanup
 */
export function setupLineSelectionHandlers(
  container: HTMLElement,
  handlers: LineSelectionHandlers,
  signal: AbortSignal
): void {
  // Wire mousedown, mousemove, mouseup handlers
}

/**
 * Check if a line element can be selected (not deletion line)
 * @param lineElement - Line element
 * @returns Whether line is selectable
 */
export function isSelectableLine(lineElement: HTMLElement): boolean {
  // Additions and context lines are selectable, deletions are not
}
```

### 2. Update script.ts

Replace inline selection logic with import and call to extracted functions.

## Files to Create/Modify

| File | Action |
|------|--------|
| `components/diff/LineSelection.ts` | Create |
| `components/diff/index.ts` | Update |
| `script.ts` | Update |

## Test Scenarios

### TS1: Single Line Select
- **Given**: Diff displayed
- **When**: User clicks on line 10
- **Then**: Line 10 highlighted as selected

### TS2: Multi-line Select
- **Given**: Diff displayed
- **When**: User drags from line 10 to line 15
- **Then**: Lines 10-15 highlighted

### TS3: Selection Direction
- **Given**: Diff displayed
- **When**: User drags from line 15 to line 10 (reverse)
- **Then**: Lines 10-15 highlighted (normalized range)

### TS4: Clear Selection
- **Given**: Lines 10-15 selected
- **When**: User clicks elsewhere
- **Then**: Selection cleared

### TS5: Skip Deletion Lines
- **Given**: Diff with deletion on line 12
- **When**: User tries to select line 12
- **Then**: Line 12 not selectable (skipped)

### TS6: Context Lines Selectable
- **Given**: Diff with context (unchanged) line
- **When**: User clicks context line
- **Then**: Line is selectable

### TS7: Addition Lines Selectable
- **Given**: Diff with addition line
- **When**: User clicks addition line
- **Then**: Line is selectable

## Acceptance Criteria

- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] Single line selection works
- [ ] Multi-line drag selection works
- [ ] Selection normalizes direction
- [ ] Deletion lines not selectable
- [ ] Addition/context lines selectable
- [ ] Selection clears properly
- [ ] No console errors
- [ ] File size < 200 lines

## Rollback

If issues arise, revert the single commit for this task.
