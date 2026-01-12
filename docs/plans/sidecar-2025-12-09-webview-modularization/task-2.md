# Task 2: Extract Sidebar Component

**Component**: Sidebar
**File**: `src/adapters/inbound/ui/webview/components/sidebar/Sidebar.ts`
**Source Lines**: 81-140 in script.ts
**Complexity**: Low
**Dependencies**: `utils/events.ts` (getSignal)

## Objective

Extract sidebar toggle and panel resizer functionality into a dedicated component.

## Current Code Location

```typescript
// script.ts lines 81-140
// Sidebar toggle (expand/collapse) and panel resizer
```

## Functions to Extract

| Function | Description |
|----------|-------------|
| `expandSidebar()` | Expand sidebar to saved width |
| `collapseSidebar()` | Collapse sidebar |
| `setupSidebarToggle()` | Attach toggle button handler |
| `setupResizer()` | Attach resize drag handlers |

## Implementation

### 1. Create Sidebar.ts

```typescript
// components/sidebar/Sidebar.ts

export interface SidebarState {
  isCollapsed: boolean;
  width: number;
}

export interface SidebarElements {
  body: HTMLElement;
  sidebar: HTMLElement;
  toggleButton: HTMLElement;
  resizer: HTMLElement;
}

/**
 * Expand sidebar to specified width
 */
export function expandSidebar(
  elements: SidebarElements,
  width: number
): void {
  // Extract from script.ts
}

/**
 * Collapse sidebar
 */
export function collapseSidebar(elements: SidebarElements): void {
  // Extract from script.ts
}

/**
 * Setup sidebar toggle button handler
 * @param elements - DOM elements
 * @param state - Current sidebar state
 * @param signal - AbortSignal for cleanup
 */
export function setupSidebarToggle(
  elements: SidebarElements,
  state: SidebarState,
  signal: AbortSignal
): void {
  // Extract from script.ts
}

/**
 * Setup panel resizer drag handlers
 * @param elements - DOM elements
 * @param onWidthChange - Callback when width changes
 * @param signal - AbortSignal for cleanup
 */
export function setupResizer(
  elements: SidebarElements,
  onWidthChange: (width: number) => void,
  signal: AbortSignal
): void {
  // Extract from script.ts
}
```

### 2. Update Index

Add export to `components/sidebar/index.ts`.

### 3. Update script.ts

Replace inline code with import and call to extracted functions.

## Files to Create/Modify

| File | Action |
|------|--------|
| `components/sidebar/Sidebar.ts` | Create |
| `components/sidebar/index.ts` | Update |
| `script.ts` | Update |

## Test Scenarios

### TS1: Sidebar Toggles
- **Given**: Sidebar is expanded
- **When**: User clicks toggle button
- **Then**: Sidebar collapses, button shows expand icon

### TS2: Sidebar Expands
- **Given**: Sidebar is collapsed
- **When**: User clicks toggle button
- **Then**: Sidebar expands to previous width

### TS3: Sidebar Resizes
- **Given**: Sidebar is expanded
- **When**: User drags resizer
- **Then**: Sidebar width changes, stays within min/max bounds

### TS4: Resize Persists
- **Given**: User resized sidebar to 400px
- **When**: User collapses then expands sidebar
- **Then**: Sidebar returns to 400px width

## Acceptance Criteria

- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] Toggle button works correctly
- [ ] Resize drag works correctly
- [ ] Width persists across toggle cycles
- [ ] No console errors
- [ ] File size < 150 lines

## Rollback

If issues arise, revert the single commit for this task.
