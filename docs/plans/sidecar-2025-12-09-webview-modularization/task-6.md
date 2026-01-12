# Task 6: Extract DiffHeader Component

**Component**: DiffHeader
**File**: `src/adapters/inbound/ui/webview/components/diff/DiffHeader.ts`
**Source Lines**: Embedded in renderDiff (1560-1598) in script.ts
**Complexity**: Low
**Dependencies**: `utils/dom.ts` (escapeHtml)

## Objective

Extract diff header rendering including file path, stats (additions/deletions), and view mode toggle button.

## Current Code Location

```typescript
// script.ts - embedded in renderDiff function
// Header with file icon, title, stats, and toggle button
```

## Functions to Extract

| Function | Description |
|----------|-------------|
| `renderDiffHeader()` | Render complete header HTML |
| `renderDiffStats()` | Render +/- stats badges |
| `getFileIcon()` | Get appropriate icon for file type |

## Implementation

### 1. Create DiffHeader.ts

```typescript
// components/diff/DiffHeader.ts

import { escapeHtml } from '../../utils/dom';

export interface DiffStats {
  additions: number;
  deletions: number;
}

export interface DiffHeaderProps {
  filePath: string;
  stats: DiffStats;
  viewMode: 'diff' | 'scope' | 'preview';
  canToggleScope: boolean;
  canTogglePreview: boolean;
}

/**
 * Render diff header HTML
 * @param props - Header properties
 * @returns HTML string for diff header
 */
export function renderDiffHeader(props: DiffHeaderProps): string {
  // Extract from script.ts
}

/**
 * Render diff stats badges (+X -Y)
 * @param stats - Addition/deletion counts
 * @returns HTML string for stats badges
 */
export function renderDiffStats(stats: DiffStats): string {
  // Extract from script.ts
}

/**
 * Get icon for file type
 * @param filePath - File path
 * @returns Emoji icon
 */
export function getFileIcon(filePath: string): string {
  // Extract from script.ts
}

/**
 * Render view mode toggle button
 * @param currentMode - Current view mode
 * @param canScope - Whether scope view available
 * @param canPreview - Whether preview available
 * @returns HTML string for toggle button
 */
export function renderViewModeToggle(
  currentMode: 'diff' | 'scope' | 'preview',
  canScope: boolean,
  canPreview: boolean
): string {
  // Extract from script.ts
}
```

### 2. Update script.ts

Replace inline header rendering with import and call to extracted function.

## Files to Create/Modify

| File | Action |
|------|--------|
| `components/diff/DiffHeader.ts` | Create |
| `components/diff/index.ts` | Update |
| `script.ts` | Update |

## Test Scenarios

### TS1: Header Renders
- **Given**: File selected
- **When**: Diff renders
- **Then**: Header shows file path and icon

### TS2: Stats Display
- **Given**: Diff has +10 -5 lines
- **When**: Header renders
- **Then**: Shows green "+10" and red "-5" badges

### TS3: TypeScript Icon
- **Given**: File is `index.ts`
- **When**: Header renders
- **Then**: Shows TypeScript icon

### TS4: Markdown Icon
- **Given**: File is `README.md`
- **When**: Header renders
- **Then**: Shows Markdown icon

### TS5: Scope Toggle Visible
- **Given**: File supports scope view (TS/JS)
- **When**: Header renders
- **Then**: "Scope" toggle button visible

### TS6: Preview Toggle Visible
- **Given**: File is markdown
- **When**: Header renders
- **Then**: "Preview" toggle button visible

### TS7: No Toggle for Unsupported
- **Given**: File is `.json`
- **When**: Header renders
- **Then**: No toggle button visible

## Acceptance Criteria

- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] Header renders with correct file path
- [ ] Stats badges show correct colors
- [ ] File icons display correctly
- [ ] Toggle buttons appear appropriately
- [ ] No console errors
- [ ] File size < 100 lines

## Rollback

If issues arise, revert the single commit for this task.
